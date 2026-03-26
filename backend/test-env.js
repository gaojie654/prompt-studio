require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('SILICONFLOW_API_KEY:', process.env.SILICONFLOW_API_KEY ? 'set' : 'not set');
