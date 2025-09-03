import { Injectable } from '@angular/core';
import FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  constructor() {}

  public exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(
      data,
      fileName + '_export_' + new Date().toUTCString() + EXCEL_EXTENSION
    );
  }

  public async exportAsExcelFileWithImages(
    json: any[],
    excelFileName: string,
    base64Images: string[]
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    // 1. Hoja de datos principal
    const dataWorksheet = workbook.addWorksheet('Datos');
    dataWorksheet.columns = Object.keys(json[0]).map((key) => ({
      header: key,
      key,
    }));
    json.forEach((row) => dataWorksheet.addRow(row));

    // 2. Hojas para imágenes
    base64Images.forEach((base64Image, index) => {
      const imageWorksheet = workbook.addWorksheet(`Gráfica ${index + 1}`);

      // Añade título a la hoja
      imageWorksheet.getCell('A1').value = `Gráfica ${index + 1}`;
      imageWorksheet.getCell('A1').font = { bold: true, size: 16 };

      // Añade la imagen
      const imageId = workbook.addImage({
        base64: base64Image.split(',')[1],
        extension: 'png',
      });

      // Posición y tamaño (ajustable)
      imageWorksheet.addImage(imageId, {
        tl: { col: 1, row: 2 }, // Columna A, fila 2
        ext: { width: 1024, height: 720 }, // Tamaño estándar
      });
    });

    // 3. Descarga el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      blob,
      `${excelFileName}_export_${new Date().toUTCString()}.${EXCEL_EXTENSION}`
    );
  }
}
