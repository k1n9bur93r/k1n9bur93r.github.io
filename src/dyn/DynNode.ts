import { DynPair } from './DynPair';

export class DynNode {
  private ParentNode: DynNode | undefined;
  private ChildNodes: DynNode[] = [];
  private Pair: DynPair = new DynPair();
  private HtmlNode: HTMLElement;

  constructor(htmlNode: HTMLElement, parentNode?: DynNode) {
    if (parentNode) {
      parentNode.AddChild(this);
      this.AddParent(parentNode);
    }
    this.HtmlNode = htmlNode;
    if (!this.HtmlNode.getAttribute('record')) {
      const parentScopedRecord = this.SearchUpForNearestRecord();
      this.HtmlNode.setAttribute('record', parentScopedRecord[0]);
      if (parentScopedRecord[1]) {
        this.HtmlNode.setAttribute('shape', parentScopedRecord[1]);
      }
      if (parentScopedRecord[2]) {
        this.HtmlNode.setAttribute('filter', parentScopedRecord[2]);
      }
    }
  }

  LoadNoad(): void {
    if (this.HtmlNode.getAttribute('dyn') !== '') {
      this.Pair.CreatePair(this.HtmlNode);
    }
  }

  AddParent(parentDyn: DynNode): void {
    this.ParentNode = parentDyn;
  }

  AddChild(dynNodeChild: DynNode): void {
    dynNodeChild.AddParent(this);
    this.ChildNodes.push(dynNodeChild);
  }

  SearchUpForNearestRecord(): [string, string | null, string | null] {
    const isRecordEmptyOrSpaces = (attributeValue: string | null): boolean => 
      attributeValue === null || attributeValue.match(/^ *$/) !== null;

    let parentNodeToSearch: DynNode | undefined = this.ParentNode;
    
    do {
      if (!parentNodeToSearch) {
        throw new Error('Dyn was not supplied a Record and no other Records were found higher up the dyn tree scope.');
      }
      const possibleNodeRecord = parentNodeToSearch.HtmlNode.getAttribute('record');
      const possibleNodeShape = parentNodeToSearch.HtmlNode.getAttribute('shape');
      const possibleNodeFilter = parentNodeToSearch.HtmlNode.getAttribute('filter');
      
      if (possibleNodeRecord && !isRecordEmptyOrSpaces(possibleNodeRecord)) {
        return [possibleNodeRecord, possibleNodeShape, possibleNodeFilter];
      }
      parentNodeToSearch = parentNodeToSearch.ParentNode;
    } while (true);
  }
}
