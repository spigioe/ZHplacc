/*
================================================================================
ZHub API - Biztonságos Háttérrendszer (JWT + Dapper)
================================================================================
*/

using Dapper;
using MySqlConnector;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- 1. KONFIGURÁCIÓ ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// JWT Beállítások
// A JWT kulcsot most már a konfigurációból (appsettings.json vagy Környezeti változó) olvassuk ki!
var jwtKey = builder.Configuration["Jwt:Key"]; 
if (string.IsNullOrEmpty(jwtKey))
{
    throw new Exception("Kritikus hiba: Nincs beállítva a JWT titkos kulcs a konfigurációban!");
}
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => 
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});
// ...

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

var app = builder.Build();

// --- 2. MIDDLEWARE ---
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();

DefaultTypeMap.MatchNamesWithUnderscores = true;

// --- SEGÉDFÜGGVÉNY AZ ID KINYERÉSÉHEZ ---
int GetUserId(ClaimsPrincipal user)
{
    var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return idClaim != null ? int.Parse(idClaim) : 0;
}

// ================================================================================
// 3. AUTH VÉGPONTOK (NYILVÁNOS)
// ================================================================================

app.MapPost("/api/auth/register", async (UserRegisterDto dto) =>
{
    using var connection = new MySqlConnection(connectionString);
    var existingUser = await connection.QueryFirstOrDefaultAsync<int>("SELECT id FROM Users WHERE email = @Email", new { Email = dto.Email });
    if (existingUser > 0) return Results.BadRequest(new { message = "Ez az e-mail cím már foglalt!" });

    string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
    var sql = "INSERT INTO Users (name, email, password_hash) VALUES (@Name, @Email, @Hash)";
    await connection.ExecuteAsync(sql, new { Name = dto.Name, Email = dto.Email, Hash = passwordHash });

    return Results.Ok(new { message = "Sikeres regisztráció!" });
});

app.MapPost("/api/auth/login", async (UserLoginDto dto) =>
{
    using var connection = new MySqlConnection(connectionString);
    var user = await connection.QueryFirstOrDefaultAsync("SELECT id, name, password_hash FROM Users WHERE email = @Email", new { Email = dto.Email });

    if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.password_hash))
        return Results.BadRequest(new { message = "Hibás e-mail cím vagy jelszó!" });

    var tokenHandler = new JwtSecurityTokenHandler();
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.id.ToString()),
            new Claim(ClaimTypes.Name, user.name)
        }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { token = tokenHandler.WriteToken(token), name = user.name });
});

// ================================================================================
// 4. VÉDETT VÉGPONTOK (TOKKAL LEZÁRVA)
// ================================================================================

// --- TANTÁRGYAK ---
app.MapGet("/api/subjects", async (ClaimsPrincipal user) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var sql = @"SELECT id AS Id, 
                       name AS Name, 
                       semester_tag AS SemesterTag, 
                       credits AS Credits, 
                       has_exam AS HasExam, 
                       notes AS Notes, 
                       zh_count AS ZhCount 
                FROM Subjects WHERE user_id = @UserId";
    var subjects = await connection.QueryAsync<Subject>(sql, new { UserId = userId });
    return Results.Ok(subjects);
}).RequireAuthorization();

app.MapPost("/api/subjects", async (ClaimsPrincipal user, Subject ujTargy) =>
{
    int userId = GetUserId(user);
    if (string.IsNullOrWhiteSpace(ujTargy.Name)) return Results.BadRequest("Név kötelező!");
    using var connection = new MySqlConnection(connectionString);
    ujTargy.UserId = userId;
var sql = @"INSERT INTO Subjects (user_id, name, semester_tag, credits, has_exam, notes, zh_count) 
                VALUES (@UserId, @Name, @SemesterTag, @Credits, @HasExam, @Notes, @ZhCount)";
    await connection.ExecuteAsync(sql, ujTargy);
    return Results.Ok("Tantárgy rögzítve!");
}).RequireAuthorization();

app.MapPut("/api/subjects/{id:int}", async (ClaimsPrincipal user, int id, Subject fTargy) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var sql = @"UPDATE Subjects SET name = @Name, semester_tag = @SemesterTag, has_exam = @HasExam, credits = @Credits, notes = @Notes, zh_count = @ZhCount 
                WHERE id = @Id AND user_id = @UserId";
    var affected = await connection.ExecuteAsync(sql, new { Id = id, UserId = userId, fTargy.Name, fTargy.SemesterTag, fTargy.HasExam, fTargy.Credits, fTargy.Notes, fTargy.ZhCount });
    return affected > 0 ? Results.Ok("Módosítva!") : Results.NotFound();
}).RequireAuthorization();

app.MapDelete("/api/subjects/{id:int}", async (ClaimsPrincipal user, int id) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var affected = await connection.ExecuteAsync("DELETE FROM Subjects WHERE id = @Id AND user_id = @UserId", new { Id = id, UserId = userId });
    return affected > 0 ? Results.Ok("Törölve!") : Results.NotFound();
}).RequireAuthorization();

// --- ZH-K ---
app.MapGet("/api/zarthelyik", async (ClaimsPrincipal user) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var sql = @"SELECT z.*, s.name AS SubjectName FROM Zarthelyik z 
                INNER JOIN Subjects s ON z.subject_id = s.id WHERE z.user_id = @UserId";
    var zhs = await connection.QueryAsync<Zarthelyi>(sql, new { UserId = userId });
    return Results.Ok(zhs);
}).RequireAuthorization();

app.MapPost("/api/zarthelyik", async (ClaimsPrincipal user, Zarthelyi ujZh) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    ujZh.UserId = userId;
    var sql = @"INSERT INTO Zarthelyik (user_id, subject_id, scheduled_week, zh_type, room, date_of, max_points, notes) 
                VALUES (@UserId, @SubjectId, @ScheduledWeek, @ZhType, @Room, @DateOf, @MaxPoints, @Notes)";
    await connection.ExecuteAsync(sql, ujZh);
    return Results.Ok("ZH rögzítve!");
}).RequireAuthorization();

app.MapPut("/api/zarthelyik/{id:int}", async (ClaimsPrincipal user, int id, Zarthelyi fZh) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var sql = @"UPDATE Zarthelyik SET subject_id = @SubjectId, scheduled_week = @ScheduledWeek, date_of = @DateOf, room = @Room, max_points = @MaxPoints, zh_type = @ZhType, notes = @Notes 
                WHERE id = @Id AND user_id = @UserId";
    var affected = await connection.ExecuteAsync(sql, new { Id = id, UserId = userId, fZh.SubjectId, fZh.ScheduledWeek, fZh.DateOf, fZh.Room, fZh.MaxPoints, fZh.ZhType, fZh.Notes });
    return affected > 0 ? Results.Ok("ZH módosítva!") : Results.NotFound();
}).RequireAuthorization();

app.MapGet("/api/exams", async (ClaimsPrincipal user) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    var sql = @"
        SELECT e.id AS Id, 
               e.user_id AS UserId, 
               e.subject_id AS SubjectId, 
               s.name AS SubjectName, 
               e.date_of AS DateOf, 
               e.room AS Room, 
               e.exam_type AS ExamType, 
               e.notes AS Notes, 
               e.semester_tag AS SemesterTag
        FROM Exams e
        JOIN Subjects s ON e.subject_id = s.id
        WHERE e.user_id = @UserId
        ORDER BY e.date_of ASC";
        
    var exams = await connection.QueryAsync<Exam>(sql, new { UserId = userId });
    return Results.Ok(exams);
}).RequireAuthorization();

app.MapPost("/api/exams", async (ClaimsPrincipal user, Exam ujVizsga) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    ujVizsga.UserId = userId;
    
    var sql = @"INSERT INTO Exams (user_id, subject_id, date_of, room, exam_type, notes, semester_tag) 
                VALUES (@UserId, @SubjectId, @DateOf, @Room, @ExamType, @Notes, @SemesterTag)";
    await connection.ExecuteAsync(sql, ujVizsga);
    return Results.Ok("Vizsga rögzítve!");
}).RequireAuthorization();

app.MapPut("/api/exams/{id:int}", async (ClaimsPrincipal user, int id, Exam fVizsga) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    var sql = @"UPDATE Exams 
                SET subject_id = @SubjectId, date_of = @DateOf, room = @Room, 
                    exam_type = @ExamType, notes = @Notes, semester_tag = @SemesterTag
                WHERE id = @Id AND user_id = @UserId";
                
    var affected = await connection.ExecuteAsync(sql, new { 
        Id = id, UserId = userId, fVizsga.SubjectId, fVizsga.DateOf, 
        fVizsga.Room, fVizsga.ExamType, fVizsga.Notes, fVizsga.SemesterTag 
    });
    
    return affected > 0 ? Results.Ok("Módosítva!") : Results.NotFound();
}).RequireAuthorization();

app.MapDelete("/api/exams/{id:int}", async (ClaimsPrincipal user, int id) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    var sql = "DELETE FROM Exams WHERE id = @Id AND user_id = @UserId";
    var affected = await connection.ExecuteAsync(sql, new { Id = id, UserId = userId });
    return affected > 0 ? Results.Ok("Törölve!") : Results.NotFound();
}).RequireAuthorization();

// --- VIZSGÁK SZINKRONIZÁLÁSA NAPTÁRBÓL (POST) ---
app.MapPost("/api/exams/sync", async (ClaimsPrincipal user, List<ExamSyncDto> incomingExams) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    await connection.OpenAsync();
    using var transaction = await connection.BeginTransactionAsync();

    try
    {
        foreach (var ex in incomingExams)
        {
            var subjSql = "SELECT id FROM Subjects WHERE user_id = @UserId AND name = @Name LIMIT 1";
            var subjectId = await connection.QuerySingleOrDefaultAsync<int?>(subjSql, new { UserId = userId, Name = ex.Subject }, transaction);

            if (subjectId == null)
            {
                var insertSubjSql = @"
                    INSERT INTO Subjects (user_id, name, semester_tag, credits, has_exam, zh_count) 
                    VALUES (@UserId, @Name, @SemesterTag, 0, 1, 0);
                    SELECT LAST_INSERT_ID();";
                
                subjectId = await connection.QuerySingleAsync<int>(insertSubjSql, 
                    new { UserId = userId, Name = ex.Subject, SemesterTag = ex.SemesterTag }, transaction);
            }

            var checkExamSql = "SELECT COUNT(1) FROM Exams WHERE user_id = @UserId AND subject_id = @SubjectId AND date_of = @DateOf";
            var exists = await connection.ExecuteScalarAsync<bool>(checkExamSql, 
                new { UserId = userId, SubjectId = subjectId, DateOf = ex.StartTime }, transaction);

            if (!exists)
            {
                var insertExamSql = @"
                    INSERT INTO Exams (user_id, subject_id, date_of, room, exam_type, semester_tag) 
                    VALUES (@UserId, @SubjectId, @DateOf, @Room, @ExamType, @SemesterTag)";
                    
                await connection.ExecuteAsync(insertExamSql, new {
                    UserId = userId,
                    SubjectId = subjectId,
                    DateOf = ex.StartTime,
                    Room = ex.Room ?? "Ismeretlen terem",
                    ExamType = ex.ExamType ?? "Vizsga",
                    SemesterTag = ex.SemesterTag
                }, transaction);
            }
        }

        await transaction.CommitAsync();
        return Results.Ok(new { message = "Vizsgák sikeresen szinkronizálva!" });
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        Console.WriteLine("Hiba a vizsgák szinkronizálásánál: " + ex.Message);
        return Results.Problem("Belső hiba történt a szinkronizálás során.");
    }
}).RequireAuthorization();

app.MapDelete("/api/zarthelyik/{id:int}", async (ClaimsPrincipal user, int id) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var affected = await connection.ExecuteAsync("DELETE FROM Zarthelyik WHERE id = @Id AND user_id = @UserId", new { Id = id, UserId = userId });
    return affected > 0 ? Results.Ok("ZH törölve!") : Results.NotFound();
}).RequireAuthorization();

// --- ÓRAREND ÉS SZINKRONIZÁCIÓ ---
app.MapPost("/api/orarend/sync", async (ClaimsPrincipal user, List<TimetableItem> importedEvents) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    await connection.ExecuteAsync("DELETE FROM Timetable WHERE user_id = @UserId AND is_custom = FALSE", new { UserId = userId });
    var insertSql = @"INSERT INTO Timetable (user_id, subject_name, class_type, start_time, end_time, room, teacher, is_custom) 
                      VALUES (@UserId, @SubjectName, @ClassType, @StartTime, @EndTime, @Room, @Teacher, FALSE)";
    foreach (var e in importedEvents) { e.UserId = userId; await connection.ExecuteAsync(insertSql, e); }
    return Results.Ok("Órarend sikeresen frissítve!");
}).RequireAuthorization();

app.MapGet("/api/orarend", async (ClaimsPrincipal user) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var orarend = await connection.QueryAsync<TimetableItem>("SELECT * FROM Timetable WHERE user_id = @UserId", new { UserId = userId });
    return Results.Ok(orarend);
}).RequireAuthorization();

app.MapPost("/api/orarend/custom", async (ClaimsPrincipal user, CustomClassDto dto) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    DateTime now = DateTime.Today;
    bool isSpring = now.Month >= 2 && now.Month <= 7;
    int year = (now.Month == 1) ? now.Year - 1 : now.Year;
    DateTime baseDate = isSpring ? new DateTime(year, 2, 10) : new DateTime(year, 9, 1);
    
    var settings = await connection.QueryFirstOrDefaultAsync<SettingsModel>(
        "SELECT week_offset FROM Settings WHERE user_id = @UserId", new { UserId = userId });
    int offset = settings?.WeekOffset ?? 0;

    int diff = (7 + (baseDate.DayOfWeek - DayOfWeek.Monday)) % 7;
    DateTime semesterMonday = baseDate.AddDays(-1 * diff).AddDays(offset * 7).Date;
    
    int weekNum = dto.ScheduledWeek > 0 ? dto.ScheduledWeek : 1;
    DateTime weekMonday = semesterMonday.AddDays((weekNum - 1) * 7);
    int targetDay = dto.DayOfWeek == 0 ? 7 : dto.DayOfWeek; 
    DateTime classDate = weekMonday.AddDays(targetDay - 1);
    
    var sql = @"INSERT INTO Timetable (user_id, subject_name, class_type, start_time, end_time, room, teacher, is_custom, notes, frequency, scheduled_week) 
                VALUES (@UserId, @SubjectName, @ClassType, @StartTime, @EndTime, @Room, 'Saját Óra', TRUE, @Notes, @Frequency, @ScheduledWeek)";
    
    if (TimeSpan.TryParse(dto.StartTime, out var st) && TimeSpan.TryParse(dto.EndTime, out var et))
    {
        await connection.ExecuteAsync(sql, new {
            UserId = userId,
            SubjectName = dto.SubjectName,
            ClassType = dto.ClassType,
            StartTime = classDate.Add(st),
            EndTime = classDate.Add(et),
            Room = dto.Room ?? "",
            Notes = dto.Notes,
            Frequency = dto.Frequency,
            ScheduledWeek = dto.ScheduledWeek
        });
        return Results.Ok("Saját óra sikeresen rögzítve!");
    }
    return Results.BadRequest("Hibás időformátum!");
}).RequireAuthorization();

// --- MEGLÉVŐ ÓRA (SAJÁT VAGY NEPTUNOS) SZERKESZTÉSE ---
app.MapPut("/api/orarend/{id:int}", async (ClaimsPrincipal user, int id, string? scope, TimetableItem fOra) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    // Lekérdezzük a jelenlegi órát, hogy tudjuk a nevét és típusát a csoportos frissítéshez
    var currentItem = await connection.QueryFirstOrDefaultAsync<TimetableItem>(
        "SELECT * FROM Timetable WHERE id = @Id AND user_id = @UserId", 
        new { Id = id, UserId = userId });
        
    if (currentItem == null) return Results.NotFound();

    // Ha a frontend azt kéri, hogy az "összeset" frissítsük (Csak Neptun óráknál van értelme)
    if (scope == "all" && !currentItem.IsCustom)
    {
        var sqlAll = @"UPDATE Timetable 
                       SET notes = @Notes, color = @Color, importance = @Importance 
                       WHERE user_id = @UserId 
                       AND subject_name = @SubjectName 
                       AND class_type = @ClassType 
                       AND is_custom = FALSE";
                       
        var affectedAll = await connection.ExecuteAsync(sqlAll, new { 
            UserId = userId, 
            Notes = fOra.Notes ?? "", 
            Color = fOra.Color ?? "", 
            Importance = fOra.Importance,
            SubjectName = currentItem.SubjectName,
            ClassType = currentItem.ClassType
        });
        
        return affectedAll > 0 ? Results.Ok("Összes azonos óra frissítve!") : Results.NotFound();
    }
    else
    {
        // Csak ez az egy óra frissítése (Vagy Saját óra esetén az 1 db szabály frissítése)
        var sqlSingle = @"UPDATE Timetable 
                          SET notes = @Notes, color = @Color, importance = @Importance 
                          WHERE id = @Id AND user_id = @UserId";
                          
        var affectedSingle = await connection.ExecuteAsync(sqlSingle, new { 
            Id = id, 
            UserId = userId, 
            Notes = fOra.Notes ?? "", 
            Color = fOra.Color ?? "", 
            Importance = fOra.Importance 
        });
        
        return affectedSingle > 0 ? Results.Ok("Óra frissítve!") : Results.NotFound();
    }
}).RequireAuthorization();
// --- SAJÁT ÓRA TÖRLÉSE ---
app.MapDelete("/api/orarend/custom/{id:int}", async (ClaimsPrincipal user, int id) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    var sql = "DELETE FROM Timetable WHERE id = @Id AND user_id = @UserId AND is_custom = TRUE";
    var affected = await connection.ExecuteAsync(sql, new { Id = id, UserId = userId });
    
    return affected > 0 ? Results.Ok("Saját óra törölve!") : Results.NotFound();
}).RequireAuthorization();

// --- BEÁLLÍTÁSOK ---
app.MapGet("/api/settings", async (ClaimsPrincipal user) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var settings = await connection.QueryFirstOrDefaultAsync<SettingsModel>("SELECT * FROM Settings WHERE user_id = @UserId", new { UserId = userId });
    return Results.Ok(settings ?? new SettingsModel());
}).RequireAuthorization();

app.MapPost("/api/settings", async (ClaimsPrincipal user, SettingsModel settings) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var sql = @"INSERT INTO Settings (user_id, semester_length, ics_url, week_offset, is_frylabs_unlocked) 
                VALUES (@UserId, @SemesterLength, @IcsUrl, @WeekOffset, @IsFrylabsUnlocked)
                ON DUPLICATE KEY UPDATE semester_length = @SemesterLength, ics_url = @IcsUrl, week_offset = @WeekOffset, is_frylabs_unlocked = @IsFrylabsUnlocked";
    await connection.ExecuteAsync(sql, new { UserId = userId, settings.SemesterLength, IcsUrl = settings.IcsUrl ?? "", settings.WeekOffset, settings.IsFrylabsUnlocked });
    return Results.Ok(new { message = "Beállítások mentve!" });
}).RequireAuthorization();

app.MapGet("/api/settings/fetch-ics", async (ClaimsPrincipal user, IHttpClientFactory clientFactory) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var settings = await connection.QueryFirstOrDefaultAsync<SettingsModel>("SELECT ics_url FROM Settings WHERE user_id = @UserId", new { UserId = userId });
    if (string.IsNullOrEmpty(settings?.IcsUrl)) return Results.BadRequest("Nincs beállítva ICS link!");

    var fetchUrl = settings.IcsUrl.Replace("webcals://", "https://", StringComparison.OrdinalIgnoreCase).Replace("webcal://", "http://", StringComparison.OrdinalIgnoreCase);
    try {
        var client = clientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        var icsContent = await client.GetStringAsync(fetchUrl);
        return Results.Text(icsContent, "text/calendar");
    } catch (Exception ex) { return Results.BadRequest($"Hiba: {ex.Message}"); }
}).RequireAuthorization();

// --- PROFIL LEKÉRÉSE ---
app.MapGet("/api/auth/me", async (ClaimsPrincipal user) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var userData = await connection.QueryFirstOrDefaultAsync(
        "SELECT id, name, email, profile_picture_url FROM Users WHERE id = @Id", new { Id = userId });

    if (userData == null) return Results.NotFound();

    return Results.Ok(new { 
        id = userData.id, 
        email = userData.email, 
        fullName = userData.name,
        profilePictureUrl = userData.profile_picture_url
    });
}).RequireAuthorization();

app.MapPut("/api/auth/profile", async (ClaimsPrincipal user, UpdateProfileDto dto) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    // Ha az emailt is változtatja, ellenőrizzük, hogy nem foglalt-e!
    var emailCheck = await connection.QueryFirstOrDefaultAsync<int>(
        "SELECT id FROM Users WHERE email = @Email AND id != @Id", new { Email = dto.Email, Id = userId });
    if (emailCheck > 0) return Results.BadRequest("Ez az email cím már foglalt!");

    var sql = "UPDATE Users SET name = @Name, email = @Email, profile_picture_url = @Pic WHERE id = @Id";
    await connection.ExecuteAsync(sql, new { Name = dto.Name, Email = dto.Email, Pic = dto.ProfilePictureUrl, Id = userId });
    
    return Results.Ok(new { message = "Profil frissítve!" });
}).RequireAuthorization();

app.MapPut("/api/auth/change-password", async (ClaimsPrincipal user, ChangePasswordDto dto) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    
    var currentHash = await connection.QueryFirstOrDefaultAsync<string>(
        "SELECT password_hash FROM Users WHERE id = @Id", new { Id = userId });

    if (currentHash == null || !BCrypt.Net.BCrypt.Verify(dto.OldPassword, currentHash))
        return Results.BadRequest("A régi jelszó helytelen!");

    string newHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
    await connection.ExecuteAsync("UPDATE Users SET password_hash = @Hash WHERE id = @Id", new { Hash = newHash, Id = userId });
    
    return Results.Ok(new { message = "Jelszó sikeresen megváltoztatva!" });
}).RequireAuthorization();

// --- TÖRLÉS VÉGPONTOK (MODÁLBÓL) ---
app.MapDelete("/api/subjects/clear", async (ClaimsPrincipal user) => {
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    await connection.ExecuteAsync("DELETE FROM Subjects WHERE user_id = @UserId", new { UserId = userId });
    return Results.Ok();
}).RequireAuthorization();

app.MapDelete("/api/zarthelyik/clear", async (ClaimsPrincipal user) => {
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    await connection.ExecuteAsync("DELETE FROM Zarthelyik WHERE user_id = @UserId", new { UserId = userId });
    return Results.Ok();
}).RequireAuthorization();

app.MapDelete("/api/orarend/clear", async (ClaimsPrincipal user) => {
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    await connection.ExecuteAsync("DELETE FROM Timetable WHERE user_id = @UserId", new { UserId = userId });
    return Results.Ok();
}).RequireAuthorization();

// ÚJ: Vizsgák törlése
app.MapDelete("/api/exams/clear", async (ClaimsPrincipal user) => {
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    await connection.ExecuteAsync("DELETE FROM Exams WHERE user_id = @UserId", new { UserId = userId });
    return Results.Ok();
}).RequireAuthorization();

// --- ELFELEJTETT JELSZÓ KÉRÉSE ---
app.MapPost("/api/auth/forgot-password", async (ForgotPasswordDto dto) =>
{
    using var connection = new MySqlConnection(connectionString);
    
    // 1. Megkeressük a felhasználót
    var user = await connection.QueryFirstOrDefaultAsync(
        "SELECT id, name FROM Users WHERE email = @Email", new { Email = dto.Email });

    // Biztonsági ökölszabály: Ha nem létezik az email, akkor is sikert jelzünk, 
    // hogy a hackerek ne tudják kitalálni, milyen emailek vannak regisztrálva!
    if (user == null) 
    {
        return Results.Ok(new { message = "Ha az email cím létezik a rendszerben, elküldtük a visszaállító linket." });
    }

    // 2. Generálunk egy egyedi, 32 karakteres titkos tokent és beállítjuk a lejáratot (1 óra)
    string resetToken = Guid.NewGuid().ToString("N");
    DateTime expiry = DateTime.Now.AddHours(1);

    // 3. Elmentjük az adatbázisba
    var sql = "UPDATE Users SET reset_token = @Token, reset_token_expiry = @Expiry WHERE id = @Id";
    await connection.ExecuteAsync(sql, new { Token = resetToken, Expiry = expiry, Id = user.id });

    // 4. SZIMULÁLT EMAIL KÜLDÉS A TERMINÁLBA
    Console.WriteLine("\n=======================================================");
    Console.WriteLine("✉️ [SZIMULÁLT EMAIL KIKÜLDVE]");
    Console.WriteLine($"Címzett: {dto.Email}");
    Console.WriteLine("Tárgy: platZH - Jelszó visszaállítása");
    Console.WriteLine("-------------------------------------------------------");
    Console.WriteLine($"Szia {user.name}!");
    Console.WriteLine("Kaptunk egy kérést a jelszavad visszaállítására.");
    Console.WriteLine("Az alábbi linkre kattintva (vagy a tokent kimásolva) megadhatod az új jelszavadat:");
    Console.WriteLine($"Token kód: {resetToken}");
    Console.WriteLine($"Teszt Link: http://127.0.0.1:5111/index.html?token={resetToken}");
    Console.WriteLine("Ez a kód 1 óra múlva lejár.");
    Console.WriteLine("=======================================================\n");

    return Results.Ok(new { message = "Ha az email cím létezik a rendszerben, elküldtük a visszaállító linket." });
});

// --- ÚJ JELSZÓ BEÁLLÍTÁSA A TOKEN SEGÍTSÉGÉVEL ---
app.MapPost("/api/auth/reset-password", async (ResetPasswordDto dto) =>
{
    using var connection = new MySqlConnection(connectionString);
    
    // 1. Ellenőrizzük a tokent és a lejárati időt
    var user = await connection.QueryFirstOrDefaultAsync(
        "SELECT id, reset_token_expiry FROM Users WHERE reset_token = @Token", new { Token = dto.Token });

    if (user == null || user.reset_token_expiry < DateTime.Now)
    {
        return Results.BadRequest(new { message = "Érvénytelen vagy lejárt visszaállító kód!" });
    }

    if (dto.NewPassword.Length < 6)
    {
        return Results.BadRequest(new { message = "A jelszónak legalább 6 karakternek kell lennie!" });
    }

    // 2. Új jelszó hashelése
    string newHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
    
    // 3. Jelszó frissítése és a token azonnali megsemmisítése (hogy ne lehessen újra felhasználni)
    var sql = "UPDATE Users SET password_hash = @Hash, reset_token = NULL, reset_token_expiry = NULL WHERE id = @Id";
    await connection.ExecuteAsync(sql, new { Hash = newHash, Id = user.id });

    return Results.Ok(new { message = "Sikeres jelszóváltoztatás! Most már bejelentkezhetsz az új jelszavaddal." });
});

app.MapGet("/api/todos", async (ClaimsPrincipal user) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var todos = await connection.QueryAsync<TodoItem>(
        "SELECT id AS Id, user_id AS UserId, title AS Title, is_completed AS IsCompleted, due_date AS DueDate FROM Todos WHERE user_id = @UserId ORDER BY is_completed ASC, due_date ASC", 
        new { UserId = userId });
    return Results.Ok(todos);
}).RequireAuthorization();

app.MapPost("/api/todos", async (ClaimsPrincipal user, CreateTodoDto dto) =>
{
    int userId = GetUserId(user);
    if (string.IsNullOrWhiteSpace(dto.Title)) return Results.BadRequest("A feladat neve kötelező!");

    using var connection = new MySqlConnection(connectionString);
    var sql = "INSERT INTO Todos (user_id, title, due_date, is_completed) VALUES (@UserId, @Title, @DueDate, FALSE)";
    await connection.ExecuteAsync(sql, new { UserId = userId, Title = dto.Title, DueDate = dto.DueDate });
    return Results.Ok(new { message = "Feladat hozzáadva!" });
}).RequireAuthorization();

app.MapPut("/api/todos/{id:int}/toggle", async (ClaimsPrincipal user, int id) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var sql = "UPDATE Todos SET is_completed = NOT is_completed WHERE id = @Id AND user_id = @UserId";
    var affected = await connection.ExecuteAsync(sql, new { Id = id, UserId = userId });
    return affected > 0 ? Results.Ok(new { message = "Állapot frissítve!" }) : Results.NotFound();
}).RequireAuthorization();

app.MapDelete("/api/todos/{id:int}", async (ClaimsPrincipal user, int id) =>
{
    int userId = GetUserId(user);
    using var connection = new MySqlConnection(connectionString);
    var affected = await connection.ExecuteAsync("DELETE FROM Todos WHERE id = @Id AND user_id = @UserId", new { Id = id, UserId = userId });
    return affected > 0 ? Results.Ok(new { message = "Feladat törölve!" }) : Results.NotFound();
}).RequireAuthorization();

app.Run();

// ================================================================================
// 5. MODELLEK
// ================================================================================

public class UpdateProfileDto { public string Name { get; set; } = ""; public string Email { get; set; } = ""; public string? ProfilePictureUrl { get; set; } }
public class ChangePasswordDto { public string OldPassword { get; set; } = ""; public string NewPassword { get; set; } = ""; }
public class ForgotPasswordDto { public string Email { get; set; } = ""; }
public class ResetPasswordDto { public string Token { get; set; } = ""; public string NewPassword { get; set; } = ""; }

public class UserRegisterDto { public string Name { get; set; } = ""; public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
public class UserLoginDto { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
public class SettingsModel { public int SemesterLength { get; set; } = 14; public string? IcsUrl { get; set; } public int WeekOffset { get; set; } public bool IsFrylabsUnlocked { get; set; } }
public class Subject { public int Id { get; set; } public int UserId { get; set; } public string Name { get; set; } = ""; public string SemesterTag { get; set; } = ""; public int Credits { get; set; } public bool HasExam { get; set; } public string? Notes { get; set; } public int ZhCount { get; set; } }
public class Zarthelyi { public int Id { get; set; } public int UserId { get; set; } public int SubjectId { get; set; } public string SubjectName { get; set; } = ""; public int ScheduledWeek { get; set; } public string? ZhType { get; set; } public string? Room { get; set; } public DateTime DateOf { get; set; } public int MaxPoints { get; set; } public string? Notes { get; set; } }
public class TimetableItem { 
    public int Id { get; set; } 
    public int UserId { get; set; } 
    public string SubjectName { get; set; } = ""; 
    public string? ClassType { get; set; } 
    public DateTime StartTime { get; set; } 
    public DateTime EndTime { get; set; } 
    public string? Room { get; set; } 
    public string? Teacher { get; set; } 
    public bool IsCustom { get; set; } 
    public string? Notes { get; set; }
    public int Frequency { get; set; }
    public int ScheduledWeek { get; set; }
    // ÚJ: Szín és fontosság
    public string? Color { get; set; }
    public int Importance { get; set; }
}
public class CustomClassDto
{
    public string SubjectName { get; set; }
    public string ClassType { get; set; }
    public int Frequency { get; set; } 
    public int DayOfWeek { get; set; } 
    public string Room { get; set; }
    public string StartTime { get; set; } 
    public string EndTime { get; set; }
    public bool IsCustom { get; set; }
    public string? Notes { get; set; }
    public int ScheduledWeek { get; set; }
}
public class Exam
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } 
    public DateTime DateOf { get; set; }
    public string Room { get; set; }
    public string ExamType { get; set; }
    public string Notes { get; set; }
    public string SemesterTag { get; set; }
}

public class ExamSyncDto
{
    public string Subject { get; set; }
    public string ExamType { get; set; }
    public string Room { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string SemesterTag { get; set; }
}

public class TodoItem {
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = "";
    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
}
public class CreateTodoDto {
    public string Title { get; set; } = "";
    public DateTime? DueDate { get; set; }
}