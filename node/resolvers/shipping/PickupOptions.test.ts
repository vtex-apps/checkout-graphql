import PickupOptions from './PickupOptions'

test('should get pickup sla', () => {
  const pickupPointId = '123'
  const orderForm = {
    shippingData: {
      logisticsInfo: [
        {
          itemIndex: 0,
          slas: [{
            id: 'retirada na loja (123)',
            pickupPointId,
          }]
        }
      ]
    }
  }
  
  const result = PickupOptions({ id: pickupPointId }, null, { orderForm })

  expect(result).toHaveLength(1)
})

test('should not duplicate an option', () => {
  const pickupPointId = '123'
  const orderForm = {
    shippingData: {
      logisticsInfo: [
        {
          itemIndex: 0,
          slas: [{
            id: 'retirada na loja (123)',
            pickupPointId,
          }]
        },
        {
          itemIndex: 1,
          slas: [{
            id: 'retirada na loja (123)',
            pickupPointId,
          }]
        }
      ]
    }
  }
  
  const result = PickupOptions({ id: pickupPointId }, null, { orderForm })

  expect(result).toHaveLength(1)
})

test('should sum price and tax from identical options', () => {
  const pickupPointId = '123'
  const orderForm = {
    shippingData: {
      logisticsInfo: [
        {
          itemIndex: 0,
          slas: [{
            id: 'retirada na loja (123)',
            price: 100,
            tax: 100,
            shippingEstimate: '1bd',
            pickupPointId,
          }]
        },
        {
          itemIndex: 1,
          slas: [{
            id: 'retirada na loja (123)',
            price: 100,
            tax: 100,
            shippingEstimate: '1bd',
            pickupPointId,
          }]
        }
      ]
    }
  }
  
  const result = PickupOptions({ id: pickupPointId }, null, { orderForm })

  expect(result[0].price).toBe(200)
})

test('should get latest estimate from identical options with different estimates', () => {
  const pickupPointId = '123'
  const orderForm = {
    shippingData: {
      logisticsInfo: [
        {
          itemIndex: 0,
          slas: [{
            id: 'retirada na loja (123)',
            shippingEstimate: '1bd',
            pickupPointId,
          }]
        },
        {
          itemIndex: 1,
          slas: [{
            id: 'retirada na loja (123)',
            shippingEstimate: '2bd',
            pickupPointId,
          }]
        }
      ]
    }
  }
  
  const result = PickupOptions({ id: pickupPointId }, null, { orderForm })

  expect(result[0].shippingEstimate).toEqual('2bd')
})