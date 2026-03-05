# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Unique X.csproj", "./"]
RUN dotnet restore "Unique X.csproj"

# نسخ باقي ملفات المشروع وعمل Build
COPY . .
RUN dotnet build "Unique X.csproj" -c Release -o /app/build
RUN dotnet publish "Unique X.csproj" -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Unique X.dll"]