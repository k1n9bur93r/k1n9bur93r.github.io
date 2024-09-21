export class DynAlias {
    static StreamAliases: Map<string, string> = new Map();
  
    static FetchOrSetAliasIfApplicable(streamPath: string): string {
      if (DynAlias.HasAliasInPath(streamPath)) {
        let alias = '';
        [streamPath, alias] = DynAlias.ExtractStreamAlias(streamPath);
        DynAlias.SetStreamAlias(streamPath, alias);
      }
      if (DynAlias.HasAlias(streamPath)) {
        streamPath = DynAlias.GetStreamFromAlias(streamPath);
      }
      return streamPath;
    }
  
    static HasAliasInPath(streamPath: string): boolean {
      return streamPath.includes(' as ');
    }
  
    static HasAlias(alias: string): boolean {
      return this.StreamAliases.has(alias);
    }
  
    static ExtractStreamAlias(streamPath: string): [string, string] {
      return streamPath.split(' as ') as [string, string];
    }
  
    static SetStreamAlias(streamPath: string, userAlias: string): void {
      this.StreamAliases.set(userAlias, streamPath);
    }
  
    static GetStreamFromAlias(userAlias: string): string {
      const result = this.StreamAliases.get(userAlias);
      if (!result) {
        throw new Error(`Alias '${userAlias}' not found`);
      }
      return result;
    }
  }