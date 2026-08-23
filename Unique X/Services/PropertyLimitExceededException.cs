namespace Unique_X.Services
{
    // بترمى لما البروكر يحاول يضيف وحدة وهو وصل للـ PropertyLimit بتاعه
    public class PropertyLimitExceededException : Exception
    {
        public PropertyLimitExceededException(string message) : base(message) { }
    }
}