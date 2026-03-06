import express, { Router } from 'express';
import { sessionLogin, sessionLogout, sessionRefresh, verifySession } from '../controllers/session.controller';


    
const router: Router = express.Router();

router.post('/sessionLogin',(req, res)=>{
    res.json({ message: 'login recibido'})
});
router.post('/sessionRefresh', sessionRefresh);
router.post('/sessionLogout', sessionLogout);
router.get('/admin/verify', verifySession);
console.log('✅ Session routes loaded');

export default router;