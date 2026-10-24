using Unique_X.DTOs;

namespace Unique_X.Valuation
{
    public interface IValuationService
    {
        Task<List<string>> GetRegionsAsync(Unique_X.Models.PropEnums.City city, CancellationToken ct = default);
        Task<ValuationResult> EstimateAsync(ValuationRequestDto req, CancellationToken ct = default);
    }
}