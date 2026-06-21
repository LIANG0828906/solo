declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string, params?: any[]): { columns: string[]; values: any[][] }[];
    export(): Uint8Array;
    close(): void;
  }

  function initSqlJs(config?: any): Promise<SqlJsStatic>;

  export default initSqlJs;
}
