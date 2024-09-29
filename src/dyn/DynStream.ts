import { DynStreamTypes, Type } from './types';

export class DynStream {
  static CachedStreams: Map<string, any> = new Map();
  private Source: string;

  private CurrentType : Type

  constructor(source: string, typeId: DynStreamTypes) {
    this.CurrentType = this.GetType(typeId);
    this.Source = source;
  }

  private Type = (Name: string, Id: DynStreamTypes): Type => ({ Name, Id });

  private GetType(typeId: DynStreamTypes): Type {
    const foundType = this.StreamTypes.find((type) => type.Id === typeId);

    if (!foundType) {
      throw new Error('Invalid Dyn Stream. Unknown Type Id was supplied to Dyn stream.');
    }
    return foundType;
  }

  private StreamTypes: Type[] = [
    this.Type('Record', DynStreamTypes.RECORD),
    this.Type('Plate', DynStreamTypes.PLATE),
    this.Type('Dyn', DynStreamTypes.DYN)
  ];

  private Stream = (): any => DynStream.CachedStreams.get(this.Source);

  private async WaitTillFetched(key: string): Promise<any> {
    while (true) {
      const value = DynStream.CachedStreams.get(key);
      if (value !== 'fetching') {
        return value;
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  async Get(postFetchActn: (streamArg: string) => any = (streamArg: string) => streamArg): Promise<any> {
    if (this.Stream()) {
      await this.WaitTillFetched(this.Source);
      return this.Stream();
    }
    DynStream.CachedStreams.set(this.Source, 'fetching');

    return fetch(this.Source)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Invalid Stream Path. Failed to fetch ${this.CurrentType.Name} from supplied path '${this.Source}'`);
        }
        return response.text();
      })
      .then((stream) => {
        const modifiedStream = postFetchActn(stream);
        DynStream.CachedStreams.set(this.Source, modifiedStream);
        return this.Stream();
      });
  }
}