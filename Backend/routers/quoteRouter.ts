import { Router } from 'express';
import { QuoteController } from '../controllers/quoteController';

const router = Router();

router.post('/', QuoteController.createQuote);
router.get('/', QuoteController.getQuotes);
router.get('/:id', QuoteController.getQuoteById);

export const quoteRouter = router;
