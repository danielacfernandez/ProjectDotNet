using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Identity;
using ServiceTRAX.Identity;
using ServiceTRAX.Utils;
using myGrid.Engine;
using System.Collections;
using Aspose;
using Aspose.Cells;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Logging;
using ServiceTRAX.Data;
using Microsoft.Extensions.Options;

namespace ServiceTRAX.Controllers
{
    public class datagridController : ControllerBase
    {
        private IConfiguration _configuration;
        private DataBaseHandler _databaseHandler;
        private readonly IHostingEnvironment _hostingEnvironment;
        private readonly UserManager<ServiceTRAXUser> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<datagridController> _logger;
        private readonly SiteConfiguration _siteConfig;
        public datagridController(IConfiguration configuration, DataBaseHandler databaseHandler,
            IHostingEnvironment hostingEnvironment,
            UserManager<ServiceTRAXUser> userManager,
            IHttpContextAccessor httpContextAccessor,
             ILogger<datagridController> logger, IOptions<SiteConfiguration> siteConfiguration)
        {
            _configuration = configuration;
            _databaseHandler = databaseHandler;
            _hostingEnvironment = hostingEnvironment;
            _httpContextAccessor = httpContextAccessor;
            _userManager = userManager;
            _logger = logger;
            _siteConfig = siteConfiguration.Value;
        }
        public ActionResult Index()
        {
            string contentRootPath = this.getGridPath();

            return Content(contentRootPath);
        }
        private string getGridPath()
        {
            string sTemp = "";
            try
            {
                sTemp = _configuration.GetValue<string>("definitionGridsFolder");
            }
            catch
            {

            }
            if (sTemp.Trim() == "")
                sTemp = Path.Combine(_hostingEnvironment.WebRootPath, "Definition");
            return sTemp;
        }

        [HttpPost]
        public string GetConfigXML(string gridName)
        {
            string fileName = getGridFilename(gridName);
            string xmlContent = "ERROR:" + fileName + " doesn't exist.";
            if (System.IO.File.Exists(fileName))
            {
                xmlContent = System.IO.File.ReadAllText(fileName);
            }
            return xmlContent;
        }
        private string getGridFilename(string gridName)
        {
            return System.IO.Path.Combine(getGridPath(), gridName + ".xml");
        }

        [HttpPost]
        public bool DeleteConfigXML(string gridName)
        {
            string fileName = getGridFilename(gridName);
            createBackupFile(gridName);
            System.IO.File.Delete(fileName);
            return true;
        }
        [HttpPost]
        public bool cmdSetConfigXML(string gridName, string xmlContent)
        {
            string fileName = getGridFilename(gridName);
            xmlContent = clsLibrary.UpcDecrypt(xmlContent);
            createBackupFile(gridName);
            System.IO.File.WriteAllText(fileName, xmlContent);

            return true;
        }
        private void createBackupFile(string gridName)
        {
            string gridpath = getGridPath();
            string backupFolder = Path.Combine(gridpath, "backup");
            try
            {
                if (!Directory.Exists(backupFolder))
                {
                    Directory.CreateDirectory(backupFolder);
                }
                string sourceName = Path.Combine(gridpath, gridName + ".xml");
                if (System.IO.File.Exists(sourceName))
                {
                    myGrid.Engine.clsMyGrid oGrid = new clsMyGrid();
                    oGrid.XMLoad(sourceName, "", false);
                    string targetName = Path.Combine(backupFolder, gridName + "_" + oGrid.Version.version + ".xml");
                    int index = 1;
                    while (System.IO.File.Exists(targetName))
                    {
                        targetName = Path.Combine(backupFolder, gridName + "_" + oGrid.Version.version + "_" + index.ToString() + ".xml");
                        index++;
                    }
                    System.IO.File.Copy(sourceName, targetName);
                }
            }
            catch
            {
            }
        }

        [HttpPost]
        public string cmdGetConfigList()
        {
            string gridPath = getGridPath();
            DirectoryInfo objDirInfo = new DirectoryInfo(gridPath);
            string strListFiles = "";
            try
            {
                foreach (FileInfo file in objDirInfo.GetFiles("*.xml"))
                {
                    DateTime modifiedDate = System.IO.File.GetLastWriteTime(file.FullName);
                    strListFiles += Path.GetFileNameWithoutExtension(file.FullName) + @"\" + modifiedDate.ToString("yyyy-MM-dd HH:mm:ss") + "|";
                }
            }
            catch { }

            return clsLibrary.UpcEncrypt(strListFiles);
        }
        [HttpGet]
        public IActionResult cmdExport(string gridName, string sessionId, string strDataParameters)
        {
            try
            {
                clsMyGrid oclsMyGrid = getGrid(gridName, sessionId);
                using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString()))
                {
                    SqlCommand oCmd = oDataBaseSQL.sqlToSqlCommand(oclsMyGrid.getSQLSelect());
                    //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                    //oCmd.Parameters.AddWithValue("@__UserId__", User.GetUserID());
                    //string strParametersDeclared = ";@__LOGINID__;@__USERID__;";

                    string strParametersDeclared = oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID());

                    JObject objJObject = null;
                    if (!string.IsNullOrEmpty(strDataParameters))
                    {
                        objJObject = JsonConvert.DeserializeObject<JObject>(strDataParameters);
                    }


                    //add extra parameters received in the request
                    foreach (clsmyGridSelectParameter oSelectParameter in oclsMyGrid.getSelectParameters())
                    {
                        if (oCmd.Parameters.IndexOf("@" + oSelectParameter.id) < 0)
                        {
                            strParametersDeclared += oSelectParameter.id.ToUpper() + ";";
                            string strListValues = "";
                            object value = objJObject[oSelectParameter.id];

                            string strSQLParameter = @"declare  @" + oSelectParameter.id + @" table(" + oSelectParameter.id + @"  varchar(max))";
                            if (strListValues != "")
                                strSQLParameter += @"
                                    insert into @" + oSelectParameter.id + "   values " + strListValues;

                            strSQLParameter += @"
                                    declare  @" + oSelectParameter.id + "_count int =(select COUNT(*) from @" + oSelectParameter.id + ")";
                            oCmd.CommandText = strSQLParameter + @";
                                " + oCmd.CommandText;
                        }
                    }
                    if (objJObject != null)
                    {
                        foreach (var prop in objJObject)
                        {
                            if (strParametersDeclared.IndexOf(";" + prop.Key.ToUpper() + ";") < 0)
                            {
                                var value = ((JValue)prop.Value)?.Value;
                                if (value == null)
                                {
                                    oCmd.Parameters.AddWithValue("@" + prop.Key, System.DBNull.Value);
                                }
                                else
                                {
                                    oCmd.Parameters.AddWithValue("@" + prop.Key, value);
                                }
                            }
                        }
                    }
                    DataTable oTable = oDataBaseSQL.SqlCommandToTable(oCmd);
                    string newOrder = oclsMyGrid.defaultOrder;
                    //sort result
                    if (newOrder.Trim() != "")
                    {
                        DataView oView = new DataView(oTable);
                        oView.Sort = newOrder;
                        oTable = oView.ToTable();
                    }

                    Hashtable gridColumns = oclsMyGrid.getColumnsByKey();
                    // Create a License object 
                    License license = new License();
                    // Set the license of Aspose.Cells to avoid the evaluation limitations 
                    license.SetLicense(@"./Utils/Aspose/Aspose.Cells.lic");

                    // Replace any Grid name char that are invalid as a Filename (also the workbook title requires a clean name)
                    var outputFilename = string.Join("_", gridName.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
                    // Create the worksheet name > ensuring that it has at most 31 chars (Excel worksheet name supports up to 31 chars max)
                    var workSheetName = outputFilename.Substring(0, Math.Min(outputFilename.Length, 31));

                    Workbook workbook = new Workbook();
                    workbook.Worksheets.Clear();
                    Worksheet oWS = workbook.Worksheets.Add(workSheetName);
                    int indexCol = 0;
                    for (int i = 0; i < oclsMyGrid.columns.Count; i++)
                    {
                        clsmyGridColumn oCol = oclsMyGrid.columns[i];
                        if (oCol.visible)
                        {
                            AsposeSetCellValue(oWS, 0, indexCol, "center", oCol.label, false, true, "#000000", "#f0f0f0", 10, false, true, 0);
                            oWS.Cells.SetColumnWidth(indexCol, oCol.width / 10);
                            indexCol++;
                        }
                    }
                    for (int j = 0; j < oTable.Rows.Count; j++)
                    {
                        DataRow oRow = oTable.Rows[j];
                        indexCol = 0;
                        for (int i = 0; i < oclsMyGrid.columns.Count; i++)
                        {
                            clsmyGridColumn oCol = oclsMyGrid.columns[i];
                            if (oCol.visible)
                            {
                                string data = "";
                                bool isHtml = false;
                                myGridEditorType editorType;
                                Enum.TryParse(oCol.editorType, out editorType);
                                switch (editorType)
                                {
                                    case myGridEditorType.calendar:
                                        if (oTable.Columns[oCol.id] != null)
                                        {
                                            if ((oRow[oCol.id] != System.DBNull.Value) && (oRow[oCol.id] != null))
                                            {
                                                object dateObject = oRow[oCol.id];
                                                if (dateObject.GetType().FullName.ToUpper() == "SYSTEM.DATETIME")
                                                {
                                                    if (oCol.format != "")
                                                    {
                                                        data = clsLibrary.dBReadDate(dateObject).ToString(oCol.format);
                                                    }
                                                    else
                                                    {
                                                        data = clsLibrary.dBReadDate(dateObject).ToString();
                                                    }
                                                }
                                                else
                                                {
                                                    data = dateObject.ToString();
                                                }
                                            }
                                        }
                                        break;
                                    case myGridEditorType.checkbox:
                                        if (oTable.Columns[oCol.id] != null)
                                        {
                                            data = "No";
                                            if (clsLibrary.dBReadBoolean(oRow[oCol.id]) || (clsLibrary.dBReadInt(oRow[oCol.id]) == 1))
                                                data = "Yes";
                                        }
                                        break;
                                    case myGridEditorType.html:
                                        if (oTable.Columns[oCol.id] != null)
                                        {
                                            data = clsLibrary.dBReadString(oRow[oCol.id]);
                                            isHtml = true;
                                        }
                                        break;
                                    case myGridEditorType.listbox:
                                        if (oTable.Columns[oCol.labelField] != null)
                                        {
                                            data = clsLibrary.dBReadString(oRow[oCol.labelField]);
                                        }
                                        else
                                        {
                                            if (oTable.Columns[oCol.id] != null)
                                                data = clsLibrary.dBReadString(oRow[oCol.id]);
                                        }
                                        break;
                                    case myGridEditorType.textbox:
                                    case myGridEditorType.textarea:
                                        if (oTable.Columns[oCol.id] != null)
                                            if (oCol.format != "")
                                            {
                                                if ((oRow[oCol.id] != System.DBNull.Value) && (oRow[oCol.id] != null))
                                                {
                                                    float output;
                                                    if (float.TryParse(clsLibrary.dBReadString(oRow[oCol.id]), out output))
                                                    {
                                                        data = clsLibrary.dBReadDouble(oRow[oCol.id]).ToString(oCol.format);
                                                    }
                                                    else
                                                    {
                                                        data = oRow[oCol.id].ToString();
                                                    }
                                                }
                                            }
                                            else
                                            {
                                                data = clsLibrary.dBReadString(oRow[oCol.id]);
                                            }
                                        break;
                                }
                                string backgroundColor = "#f0f0f0";
                                if (j % 2 == 0) backgroundColor = "#ffffff";
                                AsposeSetCellValue(oWS, j + 1, indexCol, oCol.align, data, isHtml, false, "#000000", backgroundColor, 10, false, true, 0);
                                indexCol++;
                            }
                        }
                    }

                    using (var excelStrm = new MemoryStream())
                    {
                        // Create the excel file in a memory stream
                        workbook.Save(excelStrm, new OoxmlSaveOptions(SaveFormat.Excel97To2003));
                        // Convert the memory stream to an array to avoid the stream closed before the server reply completes
                        return File(excelStrm.ToArray(), "application/vnd.ms-excel", $"{outputFilename}.xls");
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }

        }
        #region Aspose functions

        private void AsposeSetCellValue(Worksheet oSheet, int indexRow, int indexCol, string ColumnAlign, object value, bool isHtml, bool bolder,
                string foreColor, string backgroundColor, int fontSize, bool underLine, bool drawBorder, int asposeFormatType)
        {
            try
            {
                string strValue = clsLibrary.dBReadString(value);
                if (isHtml)
                {
                    oSheet.Cells[indexRow, indexCol].HtmlString = clsLibrary.dBReadString(value);
                }
                else
                {
                    oSheet.Cells[indexRow, indexCol].Value = value;
                }
                int stylePosition = strValue.ToLower().IndexOf("style=");
                if (stylePosition >= 0)
                {
                    string strCustomStyles = strValue.Replace(@"'", @"""");
                    if (strCustomStyles.Length > stylePosition + 7)
                    {
                        strCustomStyles = strCustomStyles.Substring(stylePosition + 7);
                        int styleEnd = strCustomStyles.IndexOf('"');
                        if (styleEnd > 0)
                        {
                            string[] styles = strCustomStyles.Substring(0, styleEnd).Split(';');
                            for (int j = 0; j < styles.Length; j++)
                            {
                                string[] strParts = styles[j].Split(':');
                                if (strParts.Length > 1)
                                {
                                    switch (strParts[0])
                                    {
                                        case "font-weight":
                                            bolder = (";bolder;bold;".IndexOf(strParts[1].Trim()) >= 0);
                                            break;
                                        case "color":
                                            foreColor = strParts[1];
                                            break;
                                        case "background-color":
                                            backgroundColor = strParts[1];
                                            break;
                                        case "font-size":
                                            fontSize = clsLibrary.dBReadInt(filterChars(strParts[1], "0123456789"));
                                            break;
                                        case "text-decoration":
                                            underLine = (";underline;".IndexOf(strParts[1].Trim()) >= 0);
                                            break;
                                    }
                                }
                            }
                        }
                    }
                }
                Aspose.Cells.Style style = oSheet.Cells[indexRow, indexCol].GetStyle();
                style.Number = asposeFormatType;
                StyleFlag styleFlag = new StyleFlag();
                styleFlag.All = true;
                //styleFlag.HorizontalAlignment = true;
                switch (ColumnAlign.ToLower())
                {
                    case "center":
                        style.HorizontalAlignment = TextAlignmentType.Center;
                        break;
                    case "right":
                        style.HorizontalAlignment = TextAlignmentType.Right;
                        break;
                    default:
                        style.HorizontalAlignment = TextAlignmentType.Left;
                        break;
                }
                if (bolder)
                {
                    style.Font.IsBold = true;
                }
                if (foreColor != "")
                {
                    style.Font.Color = System.Drawing.ColorTranslator.FromHtml(foreColor);
                }
                if (fontSize > 0)
                {
                    style.Font.Size = fontSize;
                }
                if (backgroundColor != "")
                {
                    style.ForegroundColor = System.Drawing.ColorTranslator.FromHtml(backgroundColor);
                    style.Pattern = BackgroundType.Solid;
                }
                if (underLine)
                {
                    style.Font.Underline = FontUnderlineType.Single;
                }
                if (drawBorder)
                {
                    style.SetBorder(BorderType.BottomBorder, CellBorderType.Thin, System.Drawing.ColorTranslator.FromHtml("#000000"));
                    style.SetBorder(BorderType.TopBorder, CellBorderType.Thin, System.Drawing.ColorTranslator.FromHtml("#000000"));
                    style.SetBorder(BorderType.LeftBorder, CellBorderType.Thin, System.Drawing.ColorTranslator.FromHtml("#000000"));
                    style.SetBorder(BorderType.RightBorder, CellBorderType.Thin, System.Drawing.ColorTranslator.FromHtml("#000000"));
                }
                if (styleFlag != null)
                {
                    oSheet.Cells[indexRow, indexCol].SetStyle(style, styleFlag);
                }
                else
                {
                    oSheet.Cells[indexRow, indexCol].SetStyle(style);
                }
            }
            catch (Exception ex)
            {
                throw new Exception("AsposeSetCellValue() - [" + value + "] - " + ex.Message);
            }
        }
        private string filterChars(string Source, string validChars)
        {
            string strVal = "";
            for (int i = 0; i < Source.Length; i++)
                if (validChars.IndexOf(Source[i]) >= 0)
                    strVal += Source[i];
            return strVal;
        }
        private void AsposeDrawBorder(Worksheet oWS, int row, int col, int rows, int cols)
        {
            AsposeDrawBorder(oWS, row, col, rows, cols, CellBorderType.Thin);
        }
        private void AsposeDrawBorder(Worksheet oWS, int row, int col, int rows, int cols, CellBorderType oCellBorderType)
        {
            try
            {
                Aspose.Cells.Range range = oWS.Cells.CreateRange(row, col, rows, cols);
                range.SetOutlineBorder(BorderType.BottomBorder, oCellBorderType, System.Drawing.Color.Black);
                range.SetOutlineBorder(BorderType.TopBorder, oCellBorderType, System.Drawing.Color.Black);
                range.SetOutlineBorder(BorderType.RightBorder, oCellBorderType, System.Drawing.Color.Black);
                range.SetOutlineBorder(BorderType.LeftBorder, oCellBorderType, System.Drawing.Color.Black);

            }
            catch (Exception ex)
            {
                throw new Exception("AsposeDrawBorder() - [] - " + ex.Message);
            }
        }


        #endregion
        [HttpPost]
        public ResponseParameters executeAction(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                if (RequestParameters.existParameter("indexButton"))
                {
                    int indexButton = clsLibrary.dBReadInt(RequestParameters.getParameterValue("indexButton"));
                    if ((indexButton >= 0) && (indexButton < oclsMyGrid.buttons.Count))
                    {
                        clsmyGridButton oButton = oclsMyGrid.buttons[indexButton];
                        string strSQL = oButton.getSqlSentence();
                        if (strSQL != "")
                        {
                            using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString()))
                            {
                                SqlCommand oCmd = oDataBaseSQL.sqlToSqlCommand(strSQL);
                                //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                                ////can be parameters added not in the parameter collection (list of values)
                                //string strParametersDeclared = ";@__LOGINID__;";

                                string strParametersDeclared = oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID());

                                string[] strSqlParameters = oButton.getSqlParameters().Split(',');
                                foreach (string strSqlParam in strSqlParameters)
                                {
                                    if (strSqlParam.Trim() != "")
                                    {
                                        if (oCmd.Parameters.IndexOf("@" + strSqlParam) < 0)
                                        {
                                            strParametersDeclared += strSqlParam.ToUpper() + ";";
                                            object value = RequestParameters.getDataParameterValue(strSqlParam);
                                            string strListValues = "";
                                            if (value == null)
                                            {
                                                //try to read from a table list
                                                strListValues = RequestParameters.getParameterValueFromArrayList(strSqlParam);
                                            }
                                            else
                                            {
                                                if (clsLibrary.dBReadString(value).Trim() != "")
                                                    strListValues = "('" + clsLibrary.dBReadString(value) + "')";
                                            }
                                            string strSQLParameter = @"declare  @" + strSqlParam + @" table(" + strSqlParam + @"  varchar(max))";
                                            if (strListValues != "")
                                                strSQLParameter += @"
                                        insert into @" + strSqlParam + "   values " + strListValues;

                                            strSQLParameter += @"
                                        declare  @" + strSqlParam + "_count int =(select COUNT(*) from @" + strSqlParam + ")";
                                            oCmd.CommandText = strSQLParameter + @";
                                    " + oCmd.CommandText;
                                        }
                                    }
                                }
                                oCmd.CommandText = @"SET XACT_ABORT ON;
BEGIN TRY
" + oCmd.CommandText + @"
END TRY  

BEGIN CATCH  
    IF (XACT_STATE()) = -1  
    BEGIN  
        ROLLBACK TRANSACTION;  
    END;  

    IF (XACT_STATE()) = 1  
    BEGIN  
        COMMIT TRANSACTION;     
    END;  
END CATCH;";
                                foreach (clsmyGridSelectParameter oSelectParameter in oclsMyGrid.getSelectParameters())
                                {
                                    if (strParametersDeclared.IndexOf(";" + oSelectParameter.id.ToUpper() + ";") < 0)
                                    {
                                        if (oCmd.Parameters.IndexOf("@" + oSelectParameter.id.ToUpper()) < 0)
                                        {
                                            strParametersDeclared += oSelectParameter.id.ToUpper() + ";";
                                            object value = RequestParameters.getDataParameterValue(oSelectParameter.id);
                                            if (value == null)
                                            {
                                                //try to read from a table list
                                                value = RequestParameters.getParameterValueFromArrayListByIndex(oSelectParameter.id, 0);
                                            }
                                            if (value == null)
                                            {
                                                value = RequestParameters.getParameterValue(oSelectParameter.id);
                                            }
                                            if (value == null)
                                            {
                                                oCmd.Parameters.AddWithValue("@" + oSelectParameter.id.ToUpper(), System.DBNull.Value);
                                            }
                                            else
                                            {
                                                oCmd.Parameters.AddWithValue("@" + oSelectParameter.id.ToUpper(), value);
                                            }
                                        }
                                    }
                                }
                                System.Collections.Generic.Dictionary<string, object> oPars = RequestParameters.getParameters();
                                System.Collections.Hashtable oColumns = oclsMyGrid.getColumnsByKey();
                                foreach (KeyValuePair<string, object> oPar in oPars)
                                {
                                    if (strParametersDeclared.IndexOf(";" + oPar.Key.ToUpper() + ";") < 0)
                                    {
                                        if (oCmd.Parameters.IndexOf("@" + oPar.Key.ToUpper()) < 0)
                                        {
                                            clsmyGridColumn oCol = (clsmyGridColumn)oColumns[oPar.Key.ToUpper()];
                                            if (oCol != null)
                                            {
                                                strParametersDeclared += oPar.Key.ToUpper() + ";";
                                                object valueConverted = oCol.ConvertFormatedValueToValue(oPar.Value);
                                                if (valueConverted == null)
                                                {
                                                    oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                                                }
                                                else
                                                {
                                                    oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), valueConverted);
                                                }
                                            }
                                        }
                                    }
                                }
                                //add extra parameters received in the request
                                foreach (KeyValuePair<string, object> oPar in RequestParameters.getDataParameters())
                                {
                                    if (strParametersDeclared.IndexOf(";" + oPar.Key.ToUpper() + ";") < 0)
                                    {
                                        strParametersDeclared += oPar.Key.ToUpper() + ";";
                                        if (oCmd.Parameters.IndexOf("@" + oPar.Key.ToUpper()) < 0)
                                            if (oPar.Value == null)
                                            {
                                                oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                                            }
                                            else
                                            {
                                                oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), oPar.Value);
                                            }
                                    }
                                }
                                //clsLog.Write(oCmd.CommandText);
                                oCmd.ExecuteNonQuery();
                                oResponseParameters.success = true;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }

        [HttpPost]
        public ResponseParameters saveColumnWidth(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                oclsMyGrid.setColumnWidth(
                    clsLibrary.dBReadString(RequestParameters.getParameterValue("id")),
                    clsLibrary.dBReadInt(RequestParameters.getParameterValue("width")));

                saveGrid(RequestParameters.gridName, oclsMyGrid);
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }
        [HttpPost]
        public ResponseParameters saveDefaultOrder(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                string orderBy = clsLibrary.dBReadString(RequestParameters.getParameterValue("orderBy")).Trim().ToLower();
                string orderType = clsLibrary.dBReadString(RequestParameters.getParameterValue("orderType")).Trim().ToLower();
                if (orderBy != "")
                {
                    clsmyGridColumn oCol = oclsMyGrid.getColumnByKey(orderBy);
                    if (oCol != null)
                    {
                        if (oCol.editorType.ToLower() == myGridEditorType.listbox.ToString().ToLower())
                        {
                            if (oCol.labelField != "")
                                orderBy = oCol.labelField.ToLower();
                        }
                    }
                }
                oclsMyGrid.defaultOrder = orderBy + " " + orderType;
                saveGrid(RequestParameters.gridName, oclsMyGrid);

            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }



        [HttpPost]
        public ResponseParameters savePageSize(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                oclsMyGrid.pageSize = clsLibrary.dBReadInt(RequestParameters.getParameterValue("pageSize"));

                saveGrid(RequestParameters.gridName, oclsMyGrid);

            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }
        [HttpPost]
        public ResponseParameters saveConfig(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                oclsMyGrid.fixedColumns = clsLibrary.dBReadInt(RequestParameters.getParameterValue("fixedColumns"));
                oclsMyGrid.reorderColumns((object[])RequestParameters.getParameterValue("columns"));

                saveGrid(RequestParameters.gridName, oclsMyGrid);
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }
        [HttpPost]
        public ResponseParameters saveData(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {

                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString()))
                {

                    bool isNewRow = clsLibrary.dBReadBoolean(RequestParameters.getParameterValue("___IsNewRow__"));
                    SqlCommand oCmd = null;
                    string strSQL = "";
                    if (isNewRow)
                    {
                        string strInsertWhere = oclsMyGrid.getSQLInsertWhere();
                        strSQL = oclsMyGrid.getSQLInsert() + @";
                             " + oclsMyGrid.getSQLSelect(false);
                        if (strInsertWhere.Trim() != "") strSQL += @"
                                 WHERE 1=1 and " + strInsertWhere;
                    }
                    else
                    {
                        string strUpdateWhere = oclsMyGrid.getSQLUpdateWhere();
                        strSQL = oclsMyGrid.getSQLUpdate() + @";
                             " + oclsMyGrid.getSQLSelect(false);
                        if (strUpdateWhere.Trim() != "") strSQL += @"
                                     WHERE 1=1 and " + strUpdateWhere;
                    }
                    oCmd = oDataBaseSQL.sqlToSqlCommand(strSQL);


                    //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                    oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID());

                    //evaluate selectSQL parameters
                    foreach (clsmyGridSelectParameter oSelectParameter in oclsMyGrid.getSelectParameters())
                    {
                        if (oCmd.Parameters.IndexOf("@" + oSelectParameter.id.ToUpper()) < 0)
                        {
                            object value = RequestParameters.getDataParameterValue(oSelectParameter.id);
                            if (value == null)
                            {
                                //try to read from a table list
                                value = RequestParameters.getParameterValueFromArrayListByIndex(oSelectParameter.id, 0);
                            }
                            if (value == null)
                            {
                                value = RequestParameters.getParameterValue(oSelectParameter.id);
                            }
                            if (value == null)
                            {
                                oCmd.Parameters.AddWithValue("@" + oSelectParameter.id.ToUpper(), System.DBNull.Value);
                            }
                            else
                            {
                                oCmd.Parameters.AddWithValue("@" + oSelectParameter.id.ToUpper(), value);
                            }
                        }
                    }
                    System.Collections.Generic.Dictionary<string, object> oPars = RequestParameters.getParameters();
                    System.Collections.Hashtable oColumns = oclsMyGrid.getColumnsByKey();
                    foreach (KeyValuePair<string, object> oPar in oPars)
                    {
                        if (oCmd.Parameters.IndexOf("@" + oPar.Key.ToUpper()) < 0)
                        {
                            clsmyGridColumn oCol = (clsmyGridColumn)oColumns[oPar.Key.ToUpper()];
                            if (oCol != null)
                            {
                                object valueConverted = oCol.ConvertFormatedValueToValue(oPar.Value);
                                if (valueConverted == null)
                                {
                                    oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                                }
                                else
                                {
                                    oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), valueConverted);
                                }
                            }
                        }
                    }
                    //add extra parameters received in the request
                    foreach (KeyValuePair<string, object> oPar in RequestParameters.getDataParameters())
                    {
                        if (oCmd.Parameters.IndexOf("@" + oPar.Key.ToUpper()) < 0)
                            if (oPar.Value == null)
                            {
                                oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                            }
                            else
                            {
                                oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), oPar.Value);
                            }
                    }

                    DataSet oDataSet = oDataBaseSQL.SqlCommandToDataset(oCmd);
                    if (oDataSet != null)
                    {
                        if (oDataSet.Tables.Count > 0)
                        {
                            DataTable oTable = oDataSet.Tables[oDataSet.Tables.Count - 1];
                            if (oTable.Rows.Count > 0)
                            {
                                DataRow oRow = oTable.Rows[0];
                                if (oRow != null)
                                {
                                    oResponseParameters.setRow(oRow, oclsMyGrid);
                                }
                            }
                        }
                    }

                }
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }
        [HttpPost]
        public ResponseParameters deleteData(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {

                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString()))
                {
                    SqlCommand oCmd = oDataBaseSQL.sqlToSqlCommand(oclsMyGrid.getSQLDelete());
                    System.Collections.Generic.Dictionary<string, object> oPars = RequestParameters.getParameters();
                    System.Collections.Hashtable oColumns = oclsMyGrid.getColumnsByKey();
                    foreach (KeyValuePair<string, object> oPar in oPars)
                    {
                        if (oPar.Value == null)
                        {
                            oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                        }
                        else
                        {
                            object valueConverted = oPar.Value;
                            clsmyGridColumn oCol = (clsmyGridColumn)oColumns[oPar.Key.ToUpper()];
                            if (oCol != null)
                            {
                                valueConverted = oCol.ConvertFormatedValueToValue(oPar.Value);
                            }
                            if (valueConverted == null)
                            {
                                oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                            }
                            else
                            {
                                oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), valueConverted);
                            }
                        }
                    }
                    //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                    oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID());
                    oDataBaseSQL.SqlCommandToRow(oCmd);
                }
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }
        [HttpPost]
        public ResponseParameters getData(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                oResponseParameters.setTable(getTableData(RequestParameters, oclsMyGrid), RequestParameters, oclsMyGrid);
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }

        public static String _getTimestamp(DateTime value)
        {
            return value.ToString("yyyyMMddHHmmssfff");
        }

        public static String _myReplace(string toReplace, string strSearch, string strReplacement)
        {
            int index = toReplace.IndexOf(strSearch);
            if (index >= 0)
            {
                toReplace = toReplace.Replace(strSearch, strReplacement);
            }
            return toReplace;
        }

        private DataTable getTableData(myGrid.Engine.RequestParameters RequestParameters, clsMyGrid oclsMyGrid)
        {
            var start = DateTime.UtcNow;
            using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString()))
            {
                string previousOrder = oclsMyGrid.defaultOrder;
                string strSqlSelect = oclsMyGrid.getSQLSelect();
                string timestamp = _getTimestamp(DateTime.Now);
                SqlCommand oCmd = oDataBaseSQL.sqlToSqlCommand(strSqlSelect);
                //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                ////can be parameters added not in the parameter collection (list of values)
                //string strParametersDeclared = ";@__LOGINID__;";

                string strParametersDeclared = oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID());

                //evaluate selectSQL parameters
                foreach (clsmyGridSelectParameter oSelectParameter in oclsMyGrid.getSelectParameters())
                {
                    if (oCmd.Parameters.IndexOf("@" + oSelectParameter.id) < 0)
                    {
                        strParametersDeclared += oSelectParameter.id.ToUpper() + ";";
                        string strListValues = "";
                        object value = RequestParameters.getDataParameterValue(oSelectParameter.id);
                        if (value == null)
                        {
                            //try to read from a table list
                            strListValues = RequestParameters.getParameterValueFromArrayList(oSelectParameter.id);
                        }
                        else
                        {
                            if (clsLibrary.dBReadString(value).Trim() != "")
                                strListValues = "('" + clsLibrary.dBReadString(value) + "')";
                        }

                        string strSQLParameter = @"declare  @" + oSelectParameter.id + @" table(" + oSelectParameter.id + @"  varchar(max))";
                        if (strListValues != "")
                            strSQLParameter += @"
                                         insert into @" + oSelectParameter.id + "   values " + strListValues;

                        strSQLParameter += @"
                                         declare  @" + oSelectParameter.id + "_count int =(select COUNT(*) from @" + oSelectParameter.id + ")";
                        oCmd.CommandText = strSQLParameter + @";
                                     " + oCmd.CommandText;
                    }
                }

                //add extra parameters received in the request
                foreach (KeyValuePair<string, object> oPar in RequestParameters.getDataParameters())
                {
                    if (strParametersDeclared.IndexOf(";" + oPar.Key.ToUpper() + ";") < 0)
                    {
                        string cmdTxt = oCmd.CommandText;
                        //cant' check parameters in command because not all parameters are there.
                        strParametersDeclared += oPar.Key.ToUpper() + ";";
                        //if (oCmd.Parameters.IndexOf("@" + oPar.Key) < 0)
                        string paramName = "@" + oPar.Key + timestamp;
                        oCmd.CommandText = _myReplace(cmdTxt, "@" + oPar.Key, paramName);
                        if (oCmd.CommandText.Equals(cmdTxt))
                        {
                            paramName = "@" + oPar.Key;
                        }

                        if (oPar.Value == null)
                        {
                            oCmd.Parameters.AddWithValue(paramName, System.DBNull.Value);
                        }
                        else
                        {
                            oCmd.Parameters.AddWithValue(paramName, oPar.Value);
                        }
                    }
                }

                DataTable table = oDataBaseSQL.SqlCommandToTable(oCmd);
                if (_siteConfig.LogPerformanceForTEG) {
                    var end = DateTime.UtcNow;
                    var elapsedInSecs = (end - start).TotalSeconds;

                    string parameters = string.Join(", ", RequestParameters.getDataParameters().Select(x => string.Concat(x.Key, ": ", x.Value)));

                    _logger.LogInformation("[PERFORMANCE-TEG][getTableData][" + oclsMyGrid.title + "] SQL: " + oclsMyGrid.getSQLSelect().ReplaceLineEndings("") + " - Parameters: " + parameters + "- DurationInSecs:" + elapsedInSecs.ToString());
                }
                return table;
            }
        }
        [HttpPost]
        public ResponseParameters getFilterData(myGrid.Engine.RequestParameters RequestParameters)
        {

            var start = DateTime.UtcNow;

            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString())) {

                    string idCol = clsLibrary.dBReadString(RequestParameters.getParameterValue("id"));
                    string value = clsLibrary.dBReadString(RequestParameters.getParameterValue("value"));
                    clsmyGridColumn oCol = oclsMyGrid.getColumnByKey(idCol);
                    int filterItemsSize = 300;
                    if (oCol != null)
                        filterItemsSize = oCol.filterItemsSize;

                    string filterText = "";
                    SqlCommand oCmd = oDataBaseSQL.sqlToSqlCommand(oclsMyGrid.getSQLFilterSelect(idCol, value, filterItemsSize, ref filterText));

                    //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                    oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID());
                    //add extra parameters received in the request
                    foreach (KeyValuePair<string, object> oPar in RequestParameters.getDataParameters()) {
                        if (oCmd.Parameters.IndexOf("@" + oPar.Key) < 0) {
                            oCmd.Parameters.AddWithValue("@" + oPar.Key, oPar.Value == null ? System.DBNull.Value : oPar.Value);
                        }
                    }

                    DataTable oTable = oDataBaseSQL.SqlCommandToTable(oCmd);

                    oResponseParameters.setFullTable(oTable, oclsMyGrid);
                    oResponseParameters.filterText = filterText;

                    if (_siteConfig.LogPerformanceForTEG) {
                        var end = DateTime.UtcNow;
                        var elapsedInSecs = (end - start).TotalSeconds;

                        string parameters = string.Join(", ", RequestParameters.getDataParameters().Select(x => string.Concat(x.Key, ": ", x.Value)));

                        _logger.LogInformation("[PERFORMANCE-TEG][getFilterData][" + RequestParameters.gridName + "] SQL: " + oclsMyGrid.getSQLSelect().ReplaceLineEndings("") + " - Parameters: " + parameters + "- DurationInSecs:" + elapsedInSecs.ToString());
                    }
                }

            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }

            
            return oResponseParameters;
        }
        [HttpPost]
        public ResponseParameters applyFilter(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);

                string columnId = clsLibrary.dBReadString(RequestParameters.getParameterValue("id"));
                clsmyGridColumn oColumn = oclsMyGrid.getColumnByKey(columnId);

                oColumn.defaultFilter = clsLibrary.dBReadString(RequestParameters.getParameterValue("values"));
                oColumn.filterText = clsLibrary.dBReadString(RequestParameters.getParameterValue("filterText"));

                saveGrid(RequestParameters.gridName, oclsMyGrid);

            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }
        [HttpPost]
        public ResponseParameters clearFilters(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                oclsMyGrid.clearFilters();

                saveGrid(RequestParameters.gridName, oclsMyGrid);
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }


        [HttpPost]
        public ResponseParameters getConfig(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                oclsMyGrid.processDynamicObjects(RequestParameters, this.CurrentLoggedUsername());
                using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString()))
                {
                    foreach (clsmyGridColumn oColumn in oclsMyGrid.columns)
                    {
                        if (oColumn.preloadDataSelect)
                        {
                            string strSql = oColumn.getSQLDataSelect().Trim();
                            string strParametersDeclared = ";";
                            if (strSql != "")
                            {
                                //leave the order as it's comming from xml definition
                                //if (oColumn.labelField != "") strSql += " ORDER BY " + oColumn.labelField;
                                SqlCommand oCmd = oDataBaseSQL.sqlToSqlCommand(strSql);
                                System.Collections.Generic.Dictionary<string, object> oPars = RequestParameters.getParameters();
                                System.Collections.Hashtable oColumns = oclsMyGrid.getColumnsByKey();
                                foreach (KeyValuePair<string, object> oPar in oPars)
                                {
                                    strParametersDeclared += oPar.Key.ToUpper() + ";";
                                    if (oPar.Value == null)
                                    {
                                        oCmd.Parameters.AddWithValue("@" + oPar.Key, System.DBNull.Value);
                                    }
                                    else
                                    {
                                        object valueConverted = oPar.Value;
                                        clsmyGridColumn oCol = (clsmyGridColumn)oColumns[oPar.Key];
                                        if (oCol != null)
                                        {
                                            valueConverted = oCol.ConvertFormatedValueToValue(oPar.Value);
                                        }
                                        if (valueConverted == null)
                                        {
                                            oCmd.Parameters.AddWithValue("@" + oPar.Key, System.DBNull.Value);
                                        }
                                        else
                                        {
                                            oCmd.Parameters.AddWithValue("@" + oPar.Key, valueConverted);
                                        }
                                    }
                                }
                                //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                                //strParametersDeclared += "__LOGINID__;";

                                strParametersDeclared += oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID()).Substring(1);

                                //check if all columns are included in the parameters:
                                foreach (clsmyGridColumn oCol in oclsMyGrid.columns)
                                {
                                    if (strParametersDeclared.IndexOf(";" + oCol.id.ToUpper() + ";") < 0)
                                    //if (oCmd.Parameters.IndexOf("@" + oCol.id) < 0)
                                    {
                                        strParametersDeclared += oCol.id.ToUpper() + ";";
                                        oCmd.Parameters.AddWithValue("@" + oCol.id, System.DBNull.Value);
                                    }
                                }
                                //evaluate selectSQL parameters
                                foreach (clsmyGridSelectParameter oSelectParameter in oclsMyGrid.getSelectParameters())
                                {
                                    if (strParametersDeclared.IndexOf(";" + oSelectParameter.id.ToUpper() + ";") < 0)
                                    //if (oCmd.Parameters.IndexOf("@" + oSelectParameter.id) < 0)
                                    {
                                        strParametersDeclared += oSelectParameter.id.ToUpper() + ";";
                                        object value = RequestParameters.getDataParameterValue(oSelectParameter.id);
                                        if (value == null)
                                        {
                                            //try to read from a table list
                                            string strListValues = RequestParameters.getParameterValueFromArrayList(oSelectParameter.id);
                                            if (strListValues != "")
                                            {
                                                string strSQLParameter = @"declare  @" + oSelectParameter.id + @" table(FirstName  varchar(100))
                                             insert into @" + oSelectParameter.id + "   values " + strListValues;
                                                oCmd.CommandText = strSQLParameter + @";
                                             " + oCmd.CommandText;
                                            }
                                            else
                                            {
                                                oCmd.Parameters.AddWithValue("@" + oSelectParameter.id, System.DBNull.Value);
                                            }
                                        }
                                        else
                                        {
                                            oCmd.Parameters.AddWithValue("@" + oSelectParameter.id, value);
                                        }
                                    }
                                }
                                //add extra parameters received in the request
                                foreach (KeyValuePair<string, object> oPar in RequestParameters.getDataParameters())
                                {
                                    if (strParametersDeclared.IndexOf(";" + oPar.Key.ToUpper() + ";") < 0)
                                    {
                                        strParametersDeclared += oPar.Key.ToUpper() + ";";
                                        //if (oCmd.Parameters.IndexOf("@" + oPar.Key) < 0)
                                        if (oPar.Value == null)
                                        {
                                            oCmd.Parameters.AddWithValue("@" + oPar.Key, System.DBNull.Value);
                                        }
                                        else
                                        {
                                            oCmd.Parameters.AddWithValue("@" + oPar.Key, oPar.Value);
                                        }
                                    }
                                }
                                DataTable oTable = oDataBaseSQL.SqlCommandToTable(oCmd);
                                oColumn.setDataList(oTable);
                            }
                        }
                    }
                }



                oResponseParameters.data = oclsMyGrid;
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }

        [HttpPost]
        public ResponseParameters getColumnDataSelect(myGrid.Engine.RequestParameters RequestParameters)
        {
            ResponseParameters oResponseParameters = new ResponseParameters(true, new JSONError());
            try
            {
                string id = clsLibrary.dBReadString(RequestParameters.getParameterValue("__colId__"));

                clsMyGrid oclsMyGrid = getGrid(RequestParameters.gridName, RequestParameters.sessionId);
                using (DataBaseHandler oDataBaseSQL = new DataBaseHandler(oclsMyGrid.getConnectionString()))
                {
                    clsmyGridColumn oColumn = oclsMyGrid.getColumnByKey(id);
                    if (oColumn != null)
                    {
                        string strSql = oColumn.getSQLDataSelect().Trim();
                        if (strSql != "")
                        {
                            //leave the order as it's comming from xml definition
                            //if (oColumn.labelField != "") strSql += " ORDER BY " + oColumn.labelField;
                            SqlCommand oCmd = oDataBaseSQL.sqlToSqlCommand(strSql);
                            System.Collections.Generic.Dictionary<string, object> oPars = RequestParameters.getParameters();
                            System.Collections.Hashtable oColumns = oclsMyGrid.getColumnsByKey();
                            foreach (KeyValuePair<string, object> oPar in oPars)
                            {
                                if (oPar.Value == null)
                                {
                                    oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                                }
                                else
                                {
                                    object valueConverted = oPar.Value;
                                    clsmyGridColumn oCol = (clsmyGridColumn)oColumns[oPar.Key.ToUpper()];
                                    if (oCol != null)
                                    {
                                        valueConverted = oCol.ConvertFormatedValueToValue(oPar.Value);
                                    }
                                    if (valueConverted == null)
                                    {
                                        oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), System.DBNull.Value);
                                    }
                                    else
                                    {
                                        oCmd.Parameters.AddWithValue("@" + oPar.Key.ToUpper(), valueConverted);
                                    }
                                }
                            }
                            //oCmd.Parameters.AddWithValue("@__LoginId__", this.CurrentLoggedUsername());
                            oCmd.AddUserPropertiesParameters(this.CurrentLoggedUsername(), User.GetUserID());

                            //check if all columns are included in the parameters:
                            foreach (clsmyGridColumn oCol in oclsMyGrid.columns)
                            {
                                if (oCmd.Parameters.IndexOf("@" + oCol.id) < 0)
                                {
                                    oCmd.Parameters.AddWithValue("@" + oCol.id, System.DBNull.Value);
                                }
                            }
                            DataTable oTable = oDataBaseSQL.SqlCommandToTable(oCmd);
                            oResponseParameters.setFullTable(oTable, oclsMyGrid);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                oResponseParameters.success = false;
                oResponseParameters.error.number = -1;
                oResponseParameters.error.description = ex.Message;
            }
            return oResponseParameters;
        }
        private void saveGrid(string gridName, clsMyGrid oclsMyGrid)
        {
            //save grid in profile
            dataConfigUser objDBConfigUser = new dataConfigUser(_databaseHandler, this.CurrentLoggedUsername());
            string strGrid = JsonConvert.SerializeObject(oclsMyGrid);
            objDBConfigUser.set(dataConfigUser.enumConfigUser.TE_GRID, gridName, strGrid);
        }

        private clsMyGrid getGrid(string gridName, string sessionId)
        {
            clsMyGrid oclsMyGrid = new clsMyGrid();
            string fileName = getGridFilename(gridName);
            bool allowCustomization = true;
            if (System.IO.File.Exists(fileName))
            {
                //Fix session cache for it. for now read alwasy from xml
                oclsMyGrid = new clsMyGrid();
                oclsMyGrid.XMLoad(fileName, _databaseHandler.strConnectionString, false);
                oclsMyGrid.sessionId = sessionId;

                /*
                 * DateTime modification = System.IO.File.GetLastWriteTime(fileName);
                bool bReload = true;
                oclsMyGrid = _currentUser.getSessionObject<clsMyGrid>("grid_" + gridName);
                if (oclsMyGrid != null)
                {
                    bReload = (oclsMyGrid.dateTimeModify != modification);
                }
                if (bReload)
                {
                    oclsMyGrid = new clsMyGrid();
                    oclsMyGrid.XMLoad(fileName, _databaseHandler.strConnectionString, false);
                    oclsMyGrid.sessionId = sessionId;
                    oclsMyGrid.dateTimeModify = modification;
                    _currentUser.setSessionObject("grid_" + gridName, oclsMyGrid);
                }*/
                //validate fields

                if (oclsMyGrid.pageSize == 0) oclsMyGrid.pageSize = 10;
                allowCustomization = oclsMyGrid.allowCustomization;
            }
            else
            {
                throw new Exception("Grid name '" + gridName + "' doesn't exist.");
            }
            //check if there is a instance in the profile
            if (allowCustomization)
            {
                dataConfigUser objDBConfigUser = new dataConfigUser(_databaseHandler, this.CurrentLoggedUsername());
                string Value = objDBConfigUser.get(dataConfigUser.enumConfigUser.TE_GRID, gridName, "");
                if (Value != "")
                {
                    try
                    {
                        clsMyGrid oSavedclsMyGrid = JsonConvert.DeserializeObject<clsMyGrid>(Value);
                        oclsMyGrid.copyFrom(oSavedclsMyGrid);
                    }
                    catch
                    {
                    }
                }
            }
            if (oclsMyGrid.getConnectionString() == "")
                oclsMyGrid.setConnectionString(_databaseHandler.strConnectionString);
            return oclsMyGrid;

        }
    }
}


