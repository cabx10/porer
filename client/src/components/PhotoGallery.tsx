import { useState } from "react";

export default function PhotoGallery({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  if (!photos || photos.length === 0) {
    return <div style={{ height: 300, width: "100%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>No photos</div>;
  }

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 1));
  
  const PER_PAGE = 10;
  const totalPages = Math.ceil(photos.length / PER_PAGE);
  const currentThumbs = photos.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
      {/* Large Image Container */}
      <div style={{ position: "relative", height: 400, width: "100%", background: "#f0f0f0", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img 
          src={"http://localhost:4000" + photos[currentIndex]} 
          alt="Large view" 
          style={{ width: "100%", height: "100%", objectFit: "contain" }} 
        />
        
        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button onClick={handlePrev} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&lt;</button>
            <button onClick={handleNext} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&gt;</button>
          </>
        )}
        
        {/* Fullscreen Button */}
        <button onClick={() => setFullscreen(true)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer" }}>
          [ ] Fullscreen
        </button>
      </div>

      {/* Thumbnails Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 8 }}>
        {currentThumbs.map((p, idx) => {
          const actualIndex = page * PER_PAGE + idx;
          return (
            <div 
              key={actualIndex} 
              onClick={() => setCurrentIndex(actualIndex)}
              style={{
                cursor: "pointer", 
                height: 80,
                border: currentIndex === actualIndex ? "3px solid #0066cc" : "none",
                borderRadius: 4,
                overflow: "hidden",
                opacity: currentIndex === actualIndex ? 1 : 0.7
              }}
            >
              <img src={"http://localhost:4000" + p} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={"Thumb " + actualIndex} />
            </div>
          );
        })}
      </div>

      {/* Thumbnails Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 4 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev 10</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next 10</button>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", 
          background: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {/* Top Bar for Controls */}
          <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 16, zIndex: 10000 }}>
            <button onClick={handleZoomOut} style={{ background: "#333", color: "white", border: "1px solid #666", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 18 }}>-</button>
            <button onClick={() => setZoom(1)} style={{ background: "#333", color: "white", border: "1px solid #666", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 16 }}>Reset Zoom</button>
            <button onClick={handleZoomIn} style={{ background: "#333", color: "white", border: "1px solid #666", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 18 }}>+</button>
            <button onClick={() => { setFullscreen(false); setZoom(1); }} style={{ background: "#c00", color: "white", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer", fontSize: 16, marginLeft: 20 }}>Close X</button>
          </div>

          <button onClick={handlePrev} style={{ position: "absolute", left: 20, background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: "50%", width: 60, height: 60, fontSize: 30, cursor: "pointer", zIndex: 10000 }}>&lt;</button>
          <button onClick={handleNext} style={{ position: "absolute", right: 20, background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: "50%", width: 60, height: 60, fontSize: 30, cursor: "pointer", zIndex: 10000 }}>&gt;</button>

          <div style={{ width: "80%", height: "80%", overflow: zoom > 1 ? "auto" : "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img 
              src={"http://localhost:4000" + photos[currentIndex]} 
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: "scale(" + zoom + ")", transition: "transform 0.2s ease-in-out", transformOrigin: "center center", cursor: zoom > 1 ? "grab" : "default" }} 
              alt="Fullscreen view" 
            />
          </div>
          
          <div style={{ position: "absolute", bottom: 20, color: "white", fontSize: 18 }}>
             {currentIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
