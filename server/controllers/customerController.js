const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');

exports.createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
});

exports.getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const query = search
    ? {
        $or: [
          { serialNumber: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      }
    : {};
  const customers = await Customer.find(query).sort({ serialNumber: 1 });
  res.json(customers);
});

exports.getCustomerBySerial = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ serialNumber: req.params.serialNumber });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json({ message: 'Customer deleted' });
});
