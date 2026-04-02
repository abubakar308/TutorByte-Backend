import app from './app';
import seedAdmin from './app/DB';
import { startCronJobs } from './app/utils/cron';

const port = process.env.PORT || 5000;

async function bootstrap() {
    await seedAdmin();
    startCronJobs();
    app.listen(port, () => {
        console.log(`TutorByte is running on port ${port}`);
    });
}

bootstrap();
