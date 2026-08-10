import { Component, NgZone } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  RowDragEndEvent,
  RowHeightParams,
  ValidationModule,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule, ValidationModule]);

interface ProductRow {
  id: number;
  subject: string;
  sku: string;
  product: string;
  qty: number;
  price: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private gridApi?: GridApi<ProductRow>;

  constructor(private ngZone: NgZone) {}

  editingSubject = false;
  subjectBeingEdited = '';
  editedSubjectName = '';
  editedSubjectNote = '';

  subjectNotes: Record<string, string> = {
    English: 'Please label all books with the student name. Students should bring the required English resources to every lesson and keep activity books together.',
    Mathematics: 'Calculator required from Term 1. Please ensure the calculator and ruler are clearly labelled with the student name.',
    Science: 'Bring practical book to laboratory lessons. Safety and practical resources should remain together for easy access during class.',
    Art: 'Keep art supplies together in a labelled bag. Colouring pencils and glue sticks will be used across multiple projects during the year.'
  };

  rowData: ProductRow[] = [
    { id: 1, subject: 'English', sku: 'BK-ENG-101', product: 'English Activity Book', qty: 1, price: 8.95 },
    { id: 2, subject: 'English', sku: 'ST-PEN-BLU', product: 'Blue Ballpoint Pen', qty: 2, price: 1.20 },
    { id: 3, subject: 'English', sku: 'NB-A4-96', product: 'A4 Exercise Book 96 Page', qty: 2, price: 3.75 },
    { id: 4, subject: 'Mathematics', sku: 'CALC-SCI-01', product: 'Scientific Calculator', qty: 1, price: 24.95 },
    { id: 5, subject: 'Mathematics', sku: 'RUL-30CM', product: '30cm Clear Ruler', qty: 1, price: 1.95 },
    { id: 6, subject: 'Science', sku: 'BK-SCI-201', product: 'Science Practical Book', qty: 1, price: 12.50 },
    { id: 7, subject: 'Science', sku: 'PEN-MARK-BLK', product: 'Permanent Marker Black', qty: 2, price: 2.45 },
    { id: 8, subject: 'Art', sku: 'PCL-CLR-24', product: 'Colouring Pencils 24 Pack', qty: 1, price: 9.95 },
    { id: 9, subject: 'Art', sku: 'GLUE-40G', product: 'Glue Stick 40g', qty: 2, price: 3.25 },
  ];

  columnDefs: ColDef<ProductRow>[] = [
    { field: 'subject', rowGroup: true, hide: true },
    {
      field: 'sku',
      headerName: 'SKU',
      width: 175,
      rowDrag: params => !params.node.group,
      cellClass: 'product-drag-cell'
    },
    { field: 'product', headerName: 'Product', flex: 1, minWidth: 300 },
    { field: 'qty', headerName: 'Qty', width: 100, editable: true },
    {
      field: 'price', headerName: 'Price', width: 120,
      valueFormatter: p => p.value == null ? '' : `$${Number(p.value).toFixed(2)}`
    },
    {
      headerName: 'Line Total', width: 140,
      valueGetter: p => p.data ? p.data.qty * p.data.price : null,
      valueFormatter: p => p.value == null ? '' : `$${Number(p.value).toFixed(2)}`
    }
  ];

  defaultColDef: ColDef<ProductRow> = { sortable: true, resizable: true, filter: true };

  groupDisplayType: 'groupRows' = 'groupRows';

  groupRowRendererParams = {
    suppressCount: false,
    innerRenderer: (params: ICellRendererParams<ProductRow>) => {
      const subject = String(params.node.key ?? params.value ?? '');
      const wrapper = document.createElement('div');
      wrapper.className = 'subject-full-row';

      const content = document.createElement('div');
      content.className = 'subject-full-content';

      const heading = document.createElement('div');
      heading.className = 'subject-heading';

      const name = document.createElement('span');
      name.className = 'subject-name';
      name.textContent = subject;

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'subject-edit-button';
      editButton.title = `Edit ${subject}`;
      editButton.setAttribute('aria-label', `Edit ${subject}`);
      editButton.innerHTML = '✎';
      editButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        this.ngZone.run(() => this.openSubjectEditor(subject));
      });

      heading.append(name, editButton);

      const note = document.createElement('div');
      note.className = 'subject-note';
      note.textContent = this.subjectNotes[subject] || 'No subject note';

      content.append(heading, note);
      wrapper.append(content);
      return wrapper;
    }
  };

  groupDefaultExpanded = -1;
  rowDragManaged = true;
  suppressMoveWhenRowDragging = true;
  refreshAfterGroupEdit = true;
  animateRows = true;

  getRowHeight = (params: RowHeightParams<ProductRow>): number => params.node.group ? 82 : 42;

  getRowId = (params: GetRowIdParams<ProductRow>) => String(params.data.id);

  onGridReady(event: GridReadyEvent<ProductRow>): void {
    this.gridApi = event.api;
  }

  onRowDragEnd(event: RowDragEndEvent<ProductRow>): void {
    const updatedRows: ProductRow[] = [];
    event.api.forEachLeafNode(node => {
      if (node.data) updatedRows.push({ ...node.data });
    });
    this.rowData = updatedRows;
  }

  openSubjectEditor(subject: string): void {
    const value = subject.trim();
    if (!value) return;

    this.subjectBeingEdited = value;
    this.editedSubjectName = value;
    this.editedSubjectNote = this.subjectNotes[value] ?? '';
    this.editingSubject = true;

    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('#subject-name-input');
      input?.focus();
      input?.select();
    });
  }

  cancelSubjectEdit(): void {
    this.editingSubject = false;
    this.subjectBeingEdited = '';
    this.editedSubjectName = '';
    this.editedSubjectNote = '';
  }

  saveSubjectEdit(): void {
    const oldName = this.subjectBeingEdited.trim();
    const newName = this.editedSubjectName.trim();
    if (!oldName || !newName) return;

    const note = this.editedSubjectNote.trim();

    if (newName !== oldName) {
      this.rowData = this.rowData.map(row =>
        row.subject === oldName ? { ...row, subject: newName } : row
      );
      delete this.subjectNotes[oldName];
      this.gridApi?.setGridOption('rowData', this.rowData);
      this.gridApi?.refreshClientSideRowModel('group');
    }

    this.subjectNotes[newName] = note;
    this.gridApi?.refreshCells({ force: true });
    this.cancelSubjectEdit();
  }
}
