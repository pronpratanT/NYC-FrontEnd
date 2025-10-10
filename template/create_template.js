const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('PO Template');

// สร้าง header
worksheet.getCell('A1').value = 'ใบสั่งซื้อ (Purchase Order)';
worksheet.getCell('A1').font = { bold: true, size: 16 };
worksheet.mergeCells('A1:E1');
worksheet.getCell('A1').alignment = { horizontal: 'center' };

// ข้อมูล PO
worksheet.getCell('A3').value = 'หมายเลข PO:';
worksheet.getCell('B3').value = '(po_no)';
worksheet.getCell('D3').value = 'วันที่:';
worksheet.getCell('E3').value = '(po_date)';

worksheet.getCell('A4').value = 'ผู้ขาย:';
worksheet.getCell('B4').value = '(vendor_name)';
worksheet.getCell('D4').value = 'รหัสผู้ขาย:';
worksheet.getCell('E4').value = '(vendor_code)';

worksheet.getCell('A5').value = 'แผนกผู้ขอ:';
worksheet.getCell('B5').value = '(dept_request)';

worksheet.getCell('A6').value = 'สถานที่จัดส่ง:';
worksheet.getCell('B6').value = '(delivery_place)';
worksheet.getCell('D6').value = 'วันที่จัดส่ง:';
worksheet.getCell('E6').value = '(delivery_date)';

worksheet.getCell('A8').value = 'ผู้จัดทำ:';
worksheet.getCell('B8').value = '(issued_by)';
worksheet.getCell('D8').value = 'ผู้อนุมัติ:';
worksheet.getCell('E8').value = '(approved_by)';

// ตั้งค่าความกว้างของคอลัมน์
worksheet.getColumn('A').width = 15;
worksheet.getColumn('B').width = 20;
worksheet.getColumn('C').width = 5;
worksheet.getColumn('D').width = 15;
worksheet.getColumn('E').width = 20;

workbook.xlsx.writeFile('TemplatePO.xlsx').then(() => {
    console.log('Enhanced template created successfully');
});