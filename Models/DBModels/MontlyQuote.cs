namespace ServiceTRAX.Models.DBModels
{
    public class MontlyQuote
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal TotalAmount { get; set; }
        public int Quote_Count { get; set; }
    }
}
