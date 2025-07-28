// api/submit.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const mongoose = require('mongoose');

// Cloudinary setup
cloudinary.config({
  cloud_name: 'dihstpdcn',
  api_key: '248125376569948',
  api_secret: 'lmG-CCfd1NjxpWoNDJv-V6Ws4MU',
});

// Multer setup (store in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// MongoDB schema
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

const StandeeOrder = mongoose.model('StandeeOrder', standeeOrderSchema);

// POST /api/submit
router.post(
  '/',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'upi_qr', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, phone, standee_type, icons_selected, other_icons } = req.body;
      const logo = req.files?.logo?.[0];
      const upiQR = req.files?.upi_qr?.[0];

      if (!name || !phone || !standee_type || !logo) {
        return res.status(400).json({
          success: false,
          message: 'Name, Phone, Standee type and Logo are required.',
        });
      }

      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be 10 digits.',
        });
      }

      // Upload logo
      let logoUrl;
      try {
        const base64Logo = `data:${logo.mimetype};base64,${logo.buffer.toString('base64')}`;
        const uploadRes = await cloudinary.uploader.upload(base64Logo, {
          folder: 'standee_app',
        });
        logoUrl = uploadRes.secure_url;
      } catch (err) {
        console.error('[Cloudinary Logo Upload Error]', err);
        return res.status(500).json({ success: false, message: 'Logo upload failed' });
      }

      // Upload UPI QR if present
      let upiQRUrl = null;
      if (upiQR) {
        try {
          const base64QR = `data:${upiQR.mimetype};base64,${upiQR.buffer.toString('base64')}`;
          const qrUpload = await cloudinary.uploader.upload(base64QR, {
            folder: 'standee_app/upi_qr',
          });
          upiQRUrl = qrUpload.secure_url;
        } catch (err) {
          console.error('[UPI QR Upload Error]', err);
          return res.status(500).json({ success: false, message: 'UPI QR upload failed' });
        }
      }

      const newOrder = new StandeeOrder({
        name,
        phone,
        standee_type,
        icons_selected: icons_selected?.split(',') || [],
        other_icons,
        logo_url: logoUrl,
        upi_qr_url: upiQRUrl,
      });

      await newOrder.save();

      res.json({ success: true, message: 'Order submitted successfully.' });
    } catch (err) {
      console.error('[Unexpected Error]', err);
      res.status(500).json({
        success: false,
        message: 'Unexpected error occurred',
        error: err.message,
      });
    }
  }
);

module.exports = router;