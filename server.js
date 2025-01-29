const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/generate', async (req, res) => {
    const { topic, additionalInfo, suggestedLiterature, dataSources, fileFormat } = req.body;

    try {
        const response = await axios.post('https://models.inference.ai.azure.com/chat/completions', {
            headers: {
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
            },
            body: {
                messages: [
                    { role: "system", content: "" },
                    { role: "user", content: `Generate a research paper on ${topic}. Additional information: ${additionalInfo}. Suggested literature: ${suggestedLiterature}. Data sources: ${dataSources}.` }
                ],
                model: "Llama-3.3-70B-Instruct",
                temperature: 0.8,
                max_tokens: 2048,
                top_p: 0.1
            }
        });

        const fileContent = response.data.choices[0].message.content;
        const fileExtension = fileFormat === 'latex' ? 'tex' : 'docx';
        const fileName = `research_paper_${uuidv4()}.${fileExtension}`;
        const filePath = path.join(__dirname, 'generated', fileName);

        fs.writeFileSync(filePath, fileContent);

        res.json({ success: true, file: fileName });
    } catch (error) {
        console.error('Error generating research paper:', error);
        res.status(500).json({ success: false, message: 'Failed to generate research paper' });
    }
});

app.get('/download', (req, res) => {
    const fileName = req.query.file;
    const filePath = path.join(__dirname, 'generated', fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, fileName);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
