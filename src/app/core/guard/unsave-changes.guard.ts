import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  component.hasUnsavedChanges()
    ? confirm('Ada perubahan yang belum disimpan. Yakin mau keluar?')
    : true;
