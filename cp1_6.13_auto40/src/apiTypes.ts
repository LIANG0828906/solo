export interface ApiTypes {
  upload: {
    request: FormData;
    response: {
      id: string;
      name: string;
      pageCount: number;
      paragraphCount: number;
      preview: string;
    };
    error: {
      error: string;
    };
  };

  search: {
    request: {
      q: string;
    };
    response: {
      results: SearchResultDto[];
      keywords: string[];
      totalMatches: number;
    };
    error: {
      error: string;
    };
  };

  listDocuments: {
    request: void;
    response: {
      documents: DocInfoDto[];
    };
    error: {
      error: string;
    };
  };

  getDocument: {
    request: {
      id: string;
    };
    response: {
      id: string;
      name: string;
      pageCount: number;
      paragraphs: string[];
      text: string;
    };
    error: {
      error: string;
    };
  };
}

export interface DocInfoDto {
  id: string;
  name: string;
  pageCount: number;
  paragraphCount: number;
  uploadedAt: number;
  preview: string;
}

export interface SearchMatchDto {
  documentId: string;
  documentName: string;
  paragraphIndex: number;
  paragraph: string;
  context: string;
  startIndex: number;
  endIndex: number;
  keyword: string;
}

export interface SearchResultDto {
  documentId: string;
  documentName: string;
  pageCount: number;
  matchCount: number;
  matches: SearchMatchDto[];
}
