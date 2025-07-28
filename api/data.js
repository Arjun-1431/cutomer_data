const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Use the same schema you're already using
const standeeOrderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, match: /^\d{10}$/ },
  standee_type: { type: String, required: true },
  icons_selected: { type: [String], default: [] },
  other_icons: { type: String, default: '' },
  logo_url: { type: String, required: true },
  upi_qr_url: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
});

// Reuse model if already compiled
const StandeeOrder = mongoose.models.StandeeOrder || mongoose.model('StandeeOrder', standeeOrderSchema);

// GET /api/data
router.get('/', async (req, res) => {
  try {
    const orders = await StandeeOrder.find().sort({ created_at: -1 });

    const formatted = orders.map(order => ({
      _id: order._id,
      name: order.name,
      phone: order.phone,
      standee_type: order.standee_type,
      icons_selected: order.icons_selected || [],
      other_icons: order.other_icons || '',
      logo_url: order.logo_url,
      upi_qr_url: order.upi_qr_url,
      created_at: order.created_at,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error('[GET /api/data Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch data' });
  }
});

module.exports = router;
