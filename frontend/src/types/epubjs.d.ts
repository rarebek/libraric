declare module 'epubjs' {
  export interface Book {
    renderTo(element: string | HTMLElement, options?: any): Rendition
  }
  export interface Rendition {
    display(target?: any): Promise<void>
    next(): void
    prev(): void
  }
  function ePub(input: string | ArrayBuffer, options?: any): Book
  export default ePub
}
