import express from 'express';

const router = express.Router();

router.get('/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;

    const response = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
    {
        headers: {
        'User-Agent': 'EcoTrack/1.0'
        }
    }
    );
    
    const data = await response.json();

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Ошибка получения продукта'
    });
  }
});

export default router;