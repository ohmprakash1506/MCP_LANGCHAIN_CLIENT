import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const ENV = {
    PORT: process.env.PORT ,
    MCP_SERVER_URL: process.env.MCP_SERVER_URL
}

export default ENV;