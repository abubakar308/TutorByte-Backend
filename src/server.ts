import app from './app';
import seedAdmin from './app/DB';

const port = process.env.PORT || 5000;

async function bootstrap() {
    await seedAdmin();
    app.listen(port, () => {
        console.log(`TutorByte is running on port ${port}`);
    });
}

bootstrap();
