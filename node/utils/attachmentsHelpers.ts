/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-loop-func */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
import { partition, propEq, omit, eqProps } from 'ramda'

type OptionItems = Array<Omit<AssemblyOptionInput, 'assemblyId'>>

interface OptionRequestUnit {
  items: OptionItems
  inputValues: Record<string, string | boolean>
}

interface AddOptionsLogicInput {
  checkout: Context['clients']['checkout']
  orderForm: CheckoutOrderForm
  parentUniqueId?: string
  options?: AssemblyOptionInput[]
  oldItems: OrderFormItem[]
}

interface AssemblyOptionBody {
  noSplitItem?: boolean
  composition?: {
    items: Array<{
      id: string
      quantity: number
      seller: string
    }>
  }
  inputValues?: Record<string, string>
}

const getNewItemsOnly = (
  previousItems: OrderFormItem[],
  allItems: OrderFormItem[]
) => {
  return allItems.filter(item => !previousItems.find(eqProps('uniqueId', item)))
}

const findRecentlyAddedParent = (
  recentlyAdded: OrderFormItem[],
  id: string,
  assemblyId: string | null
) =>
  recentlyAdded.find(i => i.id === id && i.parentAssemblyBinding === assemblyId)

export const addOptionsForItems = async (
  items: OrderFormItemInput[],
  checkout: Context['clients']['checkout'],
  orderForm: CheckoutOrderForm,
  oldItems: OrderFormItem[]
) => {
  const recentlyAdded =
    items.length > 0 ? getNewItemsOnly(oldItems, orderForm.items) : []

  for (const item of items) {
    if (!item.options || item.options.length === 0) {
      continue
    }

    const parentItem = findRecentlyAddedParent(
      recentlyAdded,
      item.id!.toString(),
      null
    )

    await addOptionsLogic({
      checkout,
      parentUniqueId: parentItem?.uniqueId,
      options: item.options,
      orderForm,
      oldItems,
    })
  }
}

const joinOptionsWithType = (options: AssemblyOptionInput[]) => {
  const result: Record<string, OptionRequestUnit> = {}

  for (const option of options) {
    const { assemblyId, ...rest } = option
    const currentArray = (result[assemblyId] && result[assemblyId].items) || []

    if (rest.id) {
      currentArray.push(rest)
    }

    result[assemblyId] = {
      inputValues: rest.inputValues,
      items: currentArray,
    }
  }

  return result
}

const removeAssemblyBody = (option: OptionRequestUnit) => ({
  composition: {
    items: option.items.map(omit(['quantity', 'options'])),
  },
})

const addAssemblyBody = (option: OptionRequestUnit) => {
  const body: AssemblyOptionBody = {}

  if (option.items.length > 0) {
    body.noSplitItem = true
    body.composition = {
      items: option.items.map(omit(['options', 'inputValues'])),
    }
  }

  if (option.inputValues) {
    body.noSplitItem = true
    body.inputValues = Object.keys(option.inputValues).reduce<
      Record<string, string>
    >((acc, key) => {
      // Transforming boolean values to string
      acc[key] = `${option.inputValues[key]}`
      return acc
    }, {})
  }

  return body
}

const addOptionsLogic = async (input: AddOptionsLogicInput) => {
  const { checkout, orderForm, parentUniqueId, options, oldItems } = input
  if (!options || options.length === 0) {
    return
  }

  let parentIndex = orderForm.items.findIndex(
    propEq('uniqueId', parentUniqueId)
  )

  if (parentIndex == null || parentIndex < 0) {
    return
  }

  const isRemove = (option: AssemblyOptionInput) => option.quantity === 0
  const [toRemove, toAdd] = partition<AssemblyOptionInput>(isRemove, options)
  const joinedToAdd = joinOptionsWithType(toAdd)
  const joinedToRemove = joinOptionsWithType(toRemove)
  const idsToAdd = Object.keys(joinedToAdd)
  const idsToRemove = Object.keys(joinedToRemove)
  let recentOrderForm: any = orderForm

  for (const assemblyId of idsToRemove) {
    parentIndex = recentOrderForm.items.findIndex(
      propEq('uniqueId', parentUniqueId)
    )
    const parsedOptions = joinedToRemove[assemblyId]
    const response = await checkout
      .removeAssemblyOptions(
        orderForm.orderFormId!,
        parentIndex,
        assemblyId,
        removeAssemblyBody(parsedOptions)
      )
      .catch(() => ({ data: recentOrderForm }))
    recentOrderForm = response.data
  }

  for (const assemblyId of idsToAdd) {
    parentIndex = recentOrderForm.items.findIndex(
      propEq('uniqueId', parentUniqueId)
    )
    const parsedOptions = joinedToAdd[assemblyId]
    recentOrderForm = await checkout
      .addAssemblyOptions(
        orderForm.orderFormId!,
        parentIndex,
        assemblyId,
        addAssemblyBody(parsedOptions)
      )
      .catch(() => recentOrderForm)
  }

  for (const assemblyId of idsToAdd) {
    const parsedOptions = joinedToAdd[assemblyId]
    const itemsWithRecursiveOptions = parsedOptions.items.filter(
      ({ options }) => !!options
    )

    if (itemsWithRecursiveOptions.length > 0) {
      await addOptionsRecursive(
        itemsWithRecursiveOptions,
        assemblyId,
        recentOrderForm,
        oldItems,
        checkout
      )
    }
  }
}

const addOptionsRecursive = async (
  items: OptionItems,
  assemblyId: string,
  orderForm: CheckoutOrderForm,
  oldItems: OrderFormItem[],
  checkout: Context['clients']['checkout']
) => {
  const recentlyAdded = getNewItemsOnly(oldItems, orderForm.items)

  for (const item of items) {
    const parentItem = findRecentlyAddedParent(
      recentlyAdded,
      item.id!.toString(),
      assemblyId
    )

    await addOptionsLogic({
      checkout,
      parentUniqueId: parentItem?.uniqueId,
      options: item.options,
      orderForm,
      oldItems,
    })
  }
}
