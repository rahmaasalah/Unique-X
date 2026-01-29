using Microsoft.AspNetCore.Mvc;
using Unique_X.DTOs;
using Unique_X.Services;
using Unique_X.Services.Interface;

namespace Unique_X.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] RegisterDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(model);

            if (!result.IsAuthenticated)
                return BadRequest(result.Message);

            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(model);

            if (!result.IsAuthenticated)
                return BadRequest(result.Message);

            return Ok(result);
        }
    }
}