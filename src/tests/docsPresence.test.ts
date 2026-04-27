import fs from 'fs';
import path from 'path';

describe('Documentation presence', () => {
  // __dirname = src/tests ; project root is two levels up
  const root = path.resolve(__dirname, '../..');
  it('api-contract.md contains API Contract heading', () => {
    const p = path.join(root, 'docs', 'api-contract.md');
    const txt = fs.readFileSync(p, 'utf-8');
    expect(txt).toMatch(/# API Contract/);
  });
  it('admin-dashboard.md contains Admin Dashboard heading', () => {
    const p = path.join(root, 'docs', 'admin-dashboard.md');
    const txt = fs.readFileSync(p, 'utf-8');
    expect(txt).toMatch(/# Admin Dashboard/);
  });
});
