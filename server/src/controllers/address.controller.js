const prisma = require('../config/prisma');

async function createAddress(req, res, next) {
  try {
    const { type, street, city, state, zipCode } = req.body;
    
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({ error: 'Missing required address fields.' });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        type: type || 'home',
        street,
        city,
        state,
        zipCode
      }
    });
    
    res.status(201).json({ address });
  } catch (err) { 
    next(err); 
  }
}

async function listAddresses(req, res, next) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id }
    });
    res.json({ addresses });
  } catch(err) { 
    next(err); 
  }
}

module.exports = { createAddress, listAddresses };
