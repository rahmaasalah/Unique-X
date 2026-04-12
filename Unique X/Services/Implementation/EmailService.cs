using System.Net;
using System.Net.Mail;

namespace Unique_X.Services.Implementation
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            // إعدادات الإيميل (يفضل وضعها في appsettings.json)
            var smtpEmail = _config["EmailSettings:Email"];
            var smtpPassword = _config["EmailSettings:Password"];
            var smtpHost = _config["EmailSettings:Host"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_config["EmailSettings:Port"] ?? "587");

            var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(smtpEmail, smtpPassword)
            };

            var mailMessage = new MailMessage(from: smtpEmail, to: toEmail, subject, body)
            {
                IsBodyHtml = true // لكي ندعم تصميمات HTML في الإيميل
            };

            await client.SendMailAsync(mailMessage);
        }
    }
}