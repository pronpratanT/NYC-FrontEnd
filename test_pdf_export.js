// Test script to call PDF export API
const testPONo = 'TEST001'; // ใส่ PO number ที่มีจริงในระบบ
const testToken = 'your-token-here'; // ใส่ token ที่ใช้งานจริง

async function testPDFExport() {
    try {
        console.log('Testing PDF export for PO:', testPONo);
        
        // 1. Test POST to create PDF
        const response = await fetch('http://localhost:3001/api/exportPDF/PO', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                po_no: testPONo,
                download: true,
                token: testToken
            })
        });
        
        const result = await response.text();
        console.log('Response status:', response.status);
        console.log('Response:', result);
        
        if (response.ok) {
            console.log('✅ PDF created successfully!');
            
            // 2. Test GET to download PDF
            const downloadResponse = await fetch(`http://localhost:3001/api/exportPDF/PO?po_no=${testPONo}`);
            console.log('Download response status:', downloadResponse.status);
            
            if (downloadResponse.ok) {
                console.log('✅ PDF download endpoint working!');
            } else {
                console.log('❌ PDF download failed');
            }
        } else {
            console.log('❌ PDF creation failed');
        }
        
    } catch (error) {
        console.error('❌ Error testing PDF export:', error);
    }
}

// Run test
testPDFExport();