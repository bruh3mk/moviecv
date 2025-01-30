"use client";
import React from "react";

function MainComponent() {
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newMovies, setNewMovies] = useState([]);
  const [newTvShows, setNewTvShows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const fetchData = useCallback(async (type, setter) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/${type}?api_key=3e0bec569bb7de4f7b177ab9b2a9d4e4&language=ar`
      );
      const data = await response.json();
      setter(data.results);
    } catch (error) {
      console.error(error);
    }
  }, []);
  const handleSearch = useCallback(async (query) => {
    if (query.trim()) {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=3e0bec569bb7de4f7b177ab9b2a9d4e4&language=ar&query=${query}`
        );
        const data = await response.json();
        setSearchResults(data.results);
      } catch (error) {
        console.error(error);
      }
    } else {
      setSearchResults([]);
    }
  }, []);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const iframeRef = useRef(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [showBackAnimation, setShowBackAnimation] = useState(false);

  useEffect(() => {
    fetchData("movie/popular", setMovies);
    fetchData("tv/popular", setTvShows);
    fetchData("trending/all/day", setTrending);
    fetchData("movie/now_playing", setNewMovies);
    fetchData("tv/on_the_air", setNewTvShows);
    setHasInitiallyLoaded(true);
  }, [fetchData]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(
        (prev) =>
          (prev + 1) % trending.filter((item) => !item.first_air_date).length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [trending]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  const handleItemClick = async (item) => {
    const type = item.media_type || (item.first_air_date ? "tv" : "movie");
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/${type}/${item.id}?api_key=3e0bec569bb7de4f7b177ab9b2a9d4e4&language=ar`
      );
      const details = await response.json();

      const videosResponse = await fetch(
        `https://api.themoviedb.org/3/${type}/${item.id}/videos?api_key=3e0bec569bb7de4f7b177ab9b2a9d4e4`
      );
      const videosData = await videosResponse.json();
      const trailer = videosData.results?.find(
        (video) => video.type === "Trailer" && video.site === "YouTube"
      );
      setTrailerKey(trailer?.key || null);

      setSelectedItem(details);
      setShowDetails(true);
      setShowBackAnimation(false);
      if (type === "tv") {
        const episodesResponse = await fetch(
          `https://api.themoviedb.org/3/tv/${item.id}/season/${selectedSeason}?api_key=3e0bec569bb7de4f7b177ab9b2a9d4e4&language=ar`
        );
        const episodesData = await episodesResponse.json();
        setEpisodes(episodesData.episodes || []);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleSeasonChange = async (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${selectedItem.id}/season/${seasonNumber}?api_key=3e0bec569bb7de4f7b177ab9b2a9d4e4&language=ar`
      );
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error(error);
    }
  };
  const handleEpisodeClick = async (episode) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${selectedItem.id}/season/${selectedSeason}/episode/${episode.episode_number}?api_key=3e0bec569bb7de4f7b177ab9b2a9d4e4&language=ar`
      );
      const episodeDetails = await response.json();
      setSelectedEpisode(episodeDetails);
      setShowEpisodeModal(true);
    } catch (error) {
      console.error(error);
    }
  };
  const MediaCard = ({ item }) => {
    const isMovie = !item.first_air_date;
    return (
      <div
        className="relative w-[150px] sm:w-[200px] m-1 sm:m-2 cursor-pointer bg-[#1e293b] rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
        onClick={() => handleItemClick(item)}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleItemClick(item);
          }
        }}
      >
        <div className="relative">
          <img
            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
            alt={item.title || item.name}
            className="w-full h-[210px] sm:h-[280px] object-cover"
          />
          <div className="absolute top-2 right-2 bg-[#3b82f6] text-white px-2 py-1 rounded-lg text-xs sm:text-sm font-bold">
            {item.vote_average?.toFixed(1)} ⭐️
          </div>
          <div className="absolute bottom-2 right-2 text-white text-xs sm:text-sm font-tajawal bg-[#3b82f6] px-2 py-1 rounded">
            {isMovie ? "فيلم" : "مسلسل"}
          </div>
        </div>
        <div className="p-2 sm:p-3">
          <h3 className="text-white font-bold text-sm sm:text-base font-tajawal text-center line-clamp-2">
            {item.title || item.name}
          </h3>
        </div>
      </div>
    );
  };
  const Section = ({ title, items }) => (
    <div className="my-4 sm:my-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-white font-tajawal px-2 sm:px-4 text-right">
        {title}
      </h2>
      <div className="flex overflow-x-auto pb-2 sm:pb-4 px-2 sm:px-4 custom-scrollbar">
        <div className="flex">
          {items?.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] dir-rtl flex flex-col">
      {showDetails && selectedItem ? (
        <div
          className={`fixed inset-0 bg-black z-50 ${
            hasInitiallyLoaded ? "animate-fadeOut" : ""
          }`}
        >
          <div
            className="h-screen overflow-y-auto custom-scrollbar"
            style={{ direction: "ltr" }}
          >
            <div className="bg-[#1e293b] w-full min-h-full relative">
              <button
                onClick={() => {
                  setShowDetails(false);
                  setShowBackAnimation(true);
                }}
                className={`absolute top-4 left-4 z-50 text-white text-xl bg-[#334155] p-2 rounded-lg hover:bg-[#4b5563] font-tajawal ${
                  showBackAnimation ? "animate-fadeIn" : ""
                }`}
              >
                رجوع
              </button>
              <div className="flex flex-col">
                <div className="relative w-full h-[300px]">
                  <img
                    src={`https://image.tmdb.org/t/p/original${selectedItem.backdrop_path}`}
                    alt={`خلفية ${selectedItem.title || selectedItem.name}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-[#1e293b] to-transparent" />
                </div>
                <div className="flex flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6">
                  <div className="w-full md:w-[250px] flex flex-col gap-4">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${selectedItem.poster_path}`}
                      alt={selectedItem.title || selectedItem.name}
                      className="w-full h-[375px] rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-4 font-tajawal text-right">
                      {selectedItem.title || selectedItem.name}
                    </h2>
                    <p className="text-gray-300 mb-6 font-tajawal text-right text-lg leading-relaxed">
                      {selectedItem.overview}
                    </p>
                    <div className="text-white font-tajawal text-right space-y-3">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-lg">التقييم:</span>
                        <div className="bg-[#3b82f6] text-white px-3 py-1 rounded-full font-bold">
                          {selectedItem.vote_average?.toFixed(1)}
                        </div>
                      </div>
                      <p className="text-lg">
                        <span className="bg-[#334155] px-3 py-1 rounded-lg ml-2">
                          التصنيف:
                        </span>
                        {selectedItem.genres?.map((genre) => (
                          <span
                            key={genre.id}
                            className="bg-[#1e293b] border border-[#3b82f6] px-3 py-1 rounded-lg mr-2"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </p>
                      <p className="text-lg">
                        تاريخ الإصدار:{" "}
                        {selectedItem.release_date ||
                          selectedItem.first_air_date}
                      </p>
                      {trailerKey && (
                        <button
                          onClick={() => setShowTrailer(true)}
                          className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg hover:bg-[#2563eb] transition-colors"
                        >
                          مشاهدة اعلان تشويقي
                        </button>
                      )}
                      {showTrailer && trailerKey && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                          <div className="bg-[#1e293b] p-4 rounded-lg w-full max-w-4xl mx-4">
                            <div className="flex justify-between items-center mb-4">
                              <button
                                onClick={() => setShowTrailer(false)}
                                className="text-white hover:text-gray-300"
                              >
                                ✕
                              </button>
                              <h3 className="text-xl font-bold text-white">
                                اعلان تشويقي{" "}
                                {selectedItem.title || selectedItem.name}
                              </h3>
                            </div>
                            <div className="relative aspect-video">
                              <iframe
                                src={`https://www.youtube.com/embed/${trailerKey}`}
                                className="w-full h-full rounded-lg"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedItem.number_of_seasons ? (
                        <>
                          <p className="text-lg">
                            عدد المواسم: {selectedItem.number_of_seasons}
                          </p>
                          <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                              {Array.from(
                                { length: selectedItem.number_of_seasons },
                                (_, i) => i + 1
                              ).map((season) => (
                                <button
                                  key={season}
                                  onClick={() => handleSeasonChange(season)}
                                  className={`px-4 py-2 rounded-lg ${
                                    selectedSeason === season
                                      ? "bg-[#3b82f6]"
                                      : "bg-[#334155]"
                                  }`}
                                >
                                  الموسم {season}
                                </button>
                              ))}
                            </div>
                            <div className="space-y-3">
                              {episodes.map((episode) => (
                                <div
                                  key={episode.id}
                                  className="bg-[#334155] p-4 rounded-lg cursor-pointer hover:bg-[#2d3748] transition-colors"
                                  onClick={() => handleEpisodeClick(episode)}
                                >
                                  <div className="flex flex-col md:flex-row gap-4">
                                    {episode.still_path && (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                        alt={`صورة من ${episode.name}`}
                                        className="w-full md:w-[200px] h-[120px] object-cover rounded-lg"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-lg">
                                          الحلقة {episode.episode_number}:{" "}
                                          {episode.name}
                                        </h3>
                                      </div>
                                      <p className="text-gray-300">
                                        {episode.overview || "لا يوجد وصف متاح"}
                                      </p>
                                      <p className="mt-2 text-sm text-gray-400">
                                        تاريخ العرض: {episode.air_date}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {showEpisodeModal && selectedEpisode && (
                            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                              <div className="bg-[#1e293b] p-6 rounded-lg max-w-4xl w-full mx-4">
                                <div className="flex justify-between items-center mb-4">
                                  <button
                                    onClick={() => setShowEpisodeModal(false)}
                                    className="text-white hover:text-gray-300"
                                  >
                                    ✕
                                  </button>
                                  <h3 className="text-xl font-bold text-white">
                                    الحلقة {selectedEpisode.episode_number}:{" "}
                                    {selectedEpisode.name}
                                  </h3>
                                </div>
                                <div className="relative">
                                  <iframe
                                    ref={iframeRef}
                                    src={`https://vidsrc.me/embed/tv?tmdb=${selectedItem.id}&season=${selectedSeason}&episode=${selectedEpisode.episode_number}`}
                                    className="w-full h-[600px] rounded-lg"
                                    allowFullScreen
                                    allow="autoplay; fullscreen"
                                    style={{
                                      border: "none",
                                      filter: `brightness(${brightness}%)`,
                                    }}
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex items-center gap-4">
                                    <button
                                      onClick={toggleFullscreen}
                                      className="text-white hover:text-blue-400"
                                    >
                                      <i
                                        className={`fas ${
                                          isFullscreen
                                            ? "fa-compress"
                                            : "fa-expand"
                                        }`}
                                      ></i>
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <i className="fas fa-volume-up text-white"></i>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) =>
                                          setVolume(e.target.value)
                                        }
                                        className="w-24"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <i className="fas fa-sun text-white"></i>
                                      <input
                                        type="range"
                                        min="50"
                                        max="150"
                                        value={brightness}
                                        onChange={(e) =>
                                          setBrightness(e.target.value)
                                        }
                                        className="w-24"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-[#334155] p-4 rounded-lg mt-4">
                          <div className="relative">
                            <iframe
                              ref={iframeRef}
                              src={`https://vidsrc.me/embed/movie?tmdb=${selectedItem.id}`}
                              className="w-full h-[600px] rounded-lg"
                              allowFullScreen
                              allow="autoplay; fullscreen"
                              style={{
                                border: "none",
                                filter: `brightness(${brightness}%)`,
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex items-center gap-4">
                              <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-blue-400"
                              >
                                <i
                                  className={`fas ${
                                    isFullscreen ? "fa-compress" : "fa-expand"
                                  }`}
                                ></i>
                              </button>
                              <div className="flex items-center gap-2">
                                <i className="fas fa-volume-up text-white"></i>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={volume}
                                  onChange={(e) => setVolume(e.target.value)}
                                  className="w-24"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <i className="fas fa-sun text-white"></i>
                                <input
                                  type="range"
                                  min="50"
                                  max="150"
                                  value={brightness}
                                  onChange={(e) =>
                                    setBrightness(e.target.value)
                                  }
                                  className="w-24"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedItem.runtime && (
                        <p className="text-lg">
                          المدة: {selectedItem.runtime} دقيقة
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-[#1e293b] py-2 sm:py-4 px-4 sm:px-8">
            <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6] font-tajawal text-center">
              MovieCV
            </h1>
            <div className="mt-2 sm:mt-4">
              <input
                type="text"
                placeholder="ابحث عن فيلم..."
                className="w-full p-2 rounded-lg bg-[#334155] text-white font-tajawal text-right custom-scrollbar text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>
          <main className="flex-1">
            <div className="custom-scrollbar">
              {searchResults.length > 0 ? (
                <Section title="نتائج البحث" items={searchResults} />
              ) : (
                <>
                  <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] mb-4 sm:mb-8 overflow-hidden">
                    <div className="absolute inset-0">
                      {trending
                        .filter((item) => !item.first_air_date)
                        .slice(0, 5)
                        .map((movie, index) => (
                          <div
                            key={movie.id}
                            className="absolute inset-0 cursor-pointer animate-crossfade"
                            onClick={() => handleItemClick(movie)}
                            style={{
                              opacity: currentSlide === index ? 1 : 0,
                              transition:
                                "opacity 1s ease-in-out, transform 1s ease-in-out",
                              zIndex: currentSlide === index ? 1 : 0,
                            }}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                            <div className="absolute bottom-0 right-0 p-4 sm:p-8 text-white">
                              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 font-tajawal">
                                {movie.title}
                              </h2>
                              <p className="text-base sm:text-lg mb-2 sm:mb-4 line-clamp-2 font-tajawal">
                                {movie.overview}
                              </p>
                              <div className="flex items-center gap-2 sm:gap-4">
                                <span className="bg-[#3b82f6] px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-tajawal text-sm sm:text-base">
                                  ⭐️ {movie.vote_average?.toFixed(1)}
                                </span>
                                <span className="bg-[#334155] px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-tajawal text-sm sm:text-base">
                                  شاهد الآن
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <Section title="أحدث الأفلام" items={newMovies} />
                  <Section title="أفلام شائعة" items={movies} />
                  <Section title="مسلسلات مميزة" items={tvShows} />
                  <Section title="مسلسلات جديدة" items={newTvShows} />
                </>
              )}
            </div>
          </main>
          <footer className="bg-[#1e293b] py-2 sm:py-4 px-4 sm:px-8 mt-4 sm:mt-6">
            <div className="container mx-auto flex flex-col items-center justify-center gap-1 sm:gap-2">
              <p className="text-white font-tajawal text-center text-sm sm:text-base">
                جميع الحقوق محفوظة © 2025
              </p>
              <a
                href="https://t.me/moviescv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#3b82f6] hover:text-[#2563eb] transition-colors text-sm sm:text-base"
              >
                <i className="fab fa-telegram text-lg sm:text-xl"></i>
                <span className="font-tajawal">تابعنا على تليجرام</span>
              </a>
            </div>
          </footer>
        </>
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes crossfade {
          0% { 
            opacity: 0;
            transform: scale(1.1);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        .animate-fadeOut {
          animation: fadeOut 2s ease-in-out;
        }

        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-crossfade {
          animation: crossfade 5s ease-in-out infinite;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #1e293b;
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
        
        .dir-rtl {
          direction: rtl;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;