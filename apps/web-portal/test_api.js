const axios = require('axios');

async function test() {
    try {
        console.log("1. Logging in as admin...");
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        let exactToken = loginRes.data;
        if (typeof loginRes.data === 'object') {
           exactToken = loginRes.data.token || loginRes.data.accessToken || exactToken;
           console.log("Token object found. Extracting.");
        } else {
           console.log("Login success! Token extracted directly.");
        }

        console.log("3. Fetching Documents search...");
        try {
            const docs = await axios.get('http://localhost:8080/api/v1/documents/search?size=50', {
                headers: { Authorization: `Bearer ${exactToken}` }
            });
            console.log("Documents Search SUCCEEDED. Rows:", docs.data?.content?.length);
        } catch(err) {
            console.error("Documents Search FAILED:", err.response ? err.response.data : err.message);
        }
        
    } catch(err) {
        console.error("LOGIN FAILED:", err.response ? err.response.data : err.message);
    }
}

test();
