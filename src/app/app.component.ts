import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellClassParams,
  ColDef,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  RowDragEndEvent,
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
    {
      headerName: '', width: 52, minWidth: 52, maxWidth: 52,
      sortable: false, filter: false, resizable: false,
      suppressHeaderMenuButton: true,
      rowDrag: params => !params.node.group,
      cellClass: (params: CellClassParams<ProductRow>) => params.node.group ? 'no-drag-cell' : 'drag-cell'
    },
    { field: 'subject', rowGroup: true, hide: true },
    { field: 'sku', headerName: 'SKU', width: 150 },
    { field: 'product', headerName: 'Product', flex: 1, minWidth: 260 },
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

  autoGroupColumnDef: ColDef<ProductRow> = {
    headerName: 'Subject / Product', minWidth: 260, flex: 1,
    cellRendererParams: {
      suppressCount: false,
      innerRenderer: (params: ICellRendererParams<ProductRow>) => {
        if (params.node.group) {
          return `<span class="subject-name">${this.escapeHtml(String(params.value ?? ''))}</span>`;
        }
        return '';
      }
    }
  };

  groupDefaultExpanded = -1;
  rowDragManaged = true;
  suppressMoveWhenRowDragging = true;
  animateRows = true;

  getRowId = (params: GetRowIdParams<ProductRow>) => String(params.data.id);

  onGridReady(event: GridReadyEvent<ProductRow>): void {
    this.gridApi = event.api;
    event.api.sizeColumnsToFit();
  }

  onRowDragEnd(event: RowDragEndEvent<ProductRow>): void {
    const updatedRows: ProductRow[] = [];
    event.api.forEachLeafNode(node => {
      if (node.data) updatedRows.push({ ...node.data });
    });
    this.rowData = updatedRows;
  }

  renameSubject(oldSubject: string): void {
    const trimmedOld = oldSubject.trim();
    if (!trimmedOld) return;
    const newName = window.prompt(`Rename subject "${trimmedOld}" to:`, trimmedOld)?.trim();
    if (!newName || newName === trimmedOld) return;

    const affectedNodes: any[] = [];
    this.gridApi?.forEachLeafNode(node => {
      if (node.data?.subject === trimmedOld) {
        node.data.subject = newName;
        affectedNodes.push(node);
      }
    });

    if (affectedNodes.length) {
      this.gridApi?.refreshClientSideRowModel('group');
      this.gridApi?.refreshCells({ force: true });
      this.rowData = this.rowData.map(row => row.subject === trimmedOld ? { ...row, subject: newName } : row);
    }
  }

  onCellDoubleClicked(event: any): void {
    if (event.node?.group && event.column?.getColId() === 'ag-Grid-AutoColumn') {
      this.renameSubject(String(event.node.key ?? ''));
    }
  }

  private escapeHtml(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }
}
