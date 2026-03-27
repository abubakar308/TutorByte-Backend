import cookieParser from 'cookie-parser';
import app from './app';

const port = process.env.PORT || 5000;

app.use(cookieParser());

app.listen(port, () => {
  console.log(`TutorByte is running on port ${port}`);
});
