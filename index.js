require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.array('files'), async (req, res) => {
    try {
        // Create vector store
        const vectorStore = await openai.beta.vectorStores.create({ name: "UserUploads" });

        // Upload files
        const fileStreams = req.files.map(file => ({
            file: file.path,
            purpose: 'assistants'
        }));

        const fileBatch = await openai.beta.vectorStores.fileBatches.uploadAndPoll(
            vectorStore.id,
            fileStreams
        );

        // Update assistant configuration
        const assistant = await openai.beta.assistants.update(
            "asst_peTLj9nqZOGDYVQj7YdiKPcb",
            {
                tool_resources: {
                    file_search: { vector_store_ids: [vectorStore.id] }
                }
            }
        );

        res.json({ message: 'Files uploaded and processed successfully', assistant });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred during file processing' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
