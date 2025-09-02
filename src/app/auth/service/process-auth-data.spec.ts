import { TestBed } from '@angular/core/testing';

import { ProcessAuthData } from './process-auth-data';

describe('ProcessAuthData', () => {
  let service: ProcessAuthData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessAuthData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
