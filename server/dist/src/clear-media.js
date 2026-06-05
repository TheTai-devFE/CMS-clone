"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach((line) => {
        if (line && !line.startsWith('#')) {
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                let value = line.substring(equalIndex + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        }
    });
}
const pool = new pg_1.default.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function clearMedia() {
    console.log('=== KAN CLEANUP UTILITY ===');
    console.log('Connecting to Neon Database using PrismaPg adapter...');
    const mediaCount = await prisma.media.count();
    console.log(`Found ${mediaCount} media records in database.`);
    if (mediaCount > 0) {
        const deleteResult = await prisma.media.deleteMany({});
        console.log(`Successfully deleted ${deleteResult.count} media records from database.`);
    }
    else {
        console.log('No media records found to delete in database.');
    }
    const uploadDir = path.join(__dirname, '..', 'uploads');
    console.log(`Target uploads directory: ${uploadDir}`);
    if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        let deletedFilesCount = 0;
        for (const file of files) {
            if (file !== '.gitkeep') {
                const filePath = path.join(uploadDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${file}`);
                    deletedFilesCount++;
                }
            }
        }
        console.log(`Deleted ${deletedFilesCount} physical files from uploads directory.`);
    }
    else {
        console.log('Uploads directory does not exist.');
    }
    console.log('=== CLEANUP COMPLETED ===');
}
clearMedia()
    .catch((err) => {
    console.error('Error during cleanup:', err);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=clear-media.js.map