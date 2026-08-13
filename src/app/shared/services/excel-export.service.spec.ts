import { TestBed } from '@angular/core/testing';
import FileSaver from 'file-saver';
import { ExcelExportService } from './excel-export.service';

describe('ExcelExportService', () => {
  let service: ExcelExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExcelExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export a plain excel file via file-saver', () => {
    const saveAsSpy = spyOn(FileSaver as any, 'saveAs').and.stub();

    service.exportAsExcelFile([{ name: 'A' }, { name: 'B' }], 'items');

    expect(saveAsSpy).toHaveBeenCalledTimes(1);
    const [blob, fileName] = saveAsSpy.calls.mostRecent().args as [Blob, string];
    expect(blob).toBeInstanceOf(Blob);
    expect(fileName).toContain('items_export_');
    expect(fileName).toContain('.xlsx');
  });

  it('should export an excel file with images', async () => {
    const saveAsSpy = spyOn(FileSaver as any, 'saveAs').and.stub();

    await service.exportAsExcelFileWithImages(
      [{ name: 'A' }],
      'report',
      ['data:image/png;base64,AAAA'],
    );

    expect(saveAsSpy).toHaveBeenCalledTimes(1);
    const [blob, fileName] = saveAsSpy.calls.mostRecent().args as [Blob, string];
    expect(blob).toBeInstanceOf(Blob);
    expect(fileName).toContain('report_export_');
  });
});
