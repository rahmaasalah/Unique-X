using Unique_X.DTOs;

namespace Unique_X.Services.Interface
{
    public interface IAuthService
    {
        Task<AuthModel> RegisterAsync(RegisterDto model);
        Task<AuthModel> LoginAsync(LoginDto model);
    }
}
