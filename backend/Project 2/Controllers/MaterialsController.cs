using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Project_2.Data;
using Project_2.Model;

namespace Project_2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialsController : ControllerBase
    {
        private readonly AceDbContext _context;

        public MaterialsController(AceDbContext context)
        {
            _context = context;
        }

        // ============ GET ALL MATERIALS ============
        // GET: api/materials
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Material>>> GetAllMaterials()
        {
            var materials = await _context.Materials
                .Where(m => m.IsActive)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(materials);
        }

        // ============ GET MATERIALS BY COURSE ============
        // GET: api/materials/course/{courseId}
        // ⭐ This is what a student portal uses
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<Material>>> GetMaterialsByCourse(int courseId)
        {
            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseId == courseId);

            if (!courseExists)
                return NotFound("Course not found.");

            var materials = await _context.Materials
                .Where(m => m.CourseId == courseId && m.IsActive)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(materials);
        }

        // ============ GET ONE MATERIAL ============
        // GET: api/materials/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Material>> GetMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();

            return Ok(material);
        }

        // ============ CREATE MATERIAL ============
        // POST: api/materials
        [HttpPost]
        public async Task<ActionResult<Material>> CreateMaterial(Material material)
        {
            var courseExists = await _context.Courses
                .AnyAsync(c => c.CourseId == material.CourseId);

            if (!courseExists)
                return BadRequest("Course does not exist.");

            material.CreatedAt = DateTime.UtcNow;
            material.IsActive = true;

            _context.Materials.Add(material);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaterial),
                new { id = material.MaterialId }, material);
        }

        // ============ UPDATE MATERIAL ============
        // PUT: api/materials/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaterial(int id, Material material)
        {
            if (id != material.MaterialId)
                return BadRequest("ID mismatch");

            var existing = await _context.Materials.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = material.Title;
            existing.Description = material.Description;
            existing.Type = material.Type;
            existing.Url = material.Url;
            existing.IsActive = material.IsActive;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============ DELETE MATERIAL (soft) ============
        // DELETE: api/materials/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound();

            material.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}