export class DynImport {
    private baseURL: string;
    private srcPath: string = '/src'; // Configurable base path for source files
  
    constructor(srcPath?: string) {
      this.baseURL = window.location.origin;
      if (srcPath) {
        this.srcPath = srcPath;
      }
    }
  
    private resolveImportPath(relativePath: string): string {
      // Remove any leading dots and slashes
      const cleanPath = relativePath.replace(/^\.\.\//, '');
      return `${this.baseURL}${this.srcPath}/${cleanPath}`;
    }
  
    private findAllImports(scriptContent: string): string[] {
      // Match all import statements with their paths
      const importRegex = /import\s+(?:{[^}]*})?\s*from\s+['"]([^'"]+)['"]/g;
      const imports: string[] = [];
      let match;
  
      while ((match = importRegex.exec(scriptContent)) !== null) {
        imports.push(match[1]);
      }
  
      return imports;
    }
  
    private replaceAllImports(scriptContent: string): string {
      // Replace each import path with its absolute version
      let modifiedScript = scriptContent;
      const imports = this.findAllImports(scriptContent);
  
      imports.forEach(importPath => {
        const absolutePath = this.resolveImportPath(importPath);
        modifiedScript = modifiedScript.replace(
          new RegExp(importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          absolutePath
        );
      });
  
      return modifiedScript;
    }
  
    public async LoadDynamicContentWithImports(scriptContent: string): Promise<void> {
      try {
        // Replace all relative imports with absolute paths
        const modifiedScript = this.replaceAllImports(scriptContent);
  
        // Create and execute the blob
        const blob = new Blob([modifiedScript], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
  
        try {
          await import(url);
        } finally {
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Error loading dynamic content:', error);
        throw error;
      }
    }
  }