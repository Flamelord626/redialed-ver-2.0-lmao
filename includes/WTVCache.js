class WTVCache {
    minisrv_config = [];
    type = null;
    fs = require("fs");
    Parser = require("rss-parser");
    fetch = require("node-fetch");

    constructor(minisrv_config = null) {
        this.minisrv_config = minisrv_config;
    }
    
    makeFriendlyString(string) {
        return string;
    }
    
    createNewsArray(data) {
        const array = data.items.slice(0, 3).map(function (item) {
            return {
                title: item.title.replace(/’|‘/g, "'").replace(/“|”/g, '"').replace(/—/g, "-").replace(/ /gi, " "),
                link: "http://frogfind.com/read.php?a=" + item.link,
                content: item.content.replace(/’|‘/g, "'").replace(/“|”/g, '"').replace(/—/g, "-").replace(/ /gi, " "),
            };
        });
        return array;
    }
    
    async updateNewsCache() {
        let parser = new this.Parser();
        var newsCache = {};

        // download and format data from NYT's RSS feeds
        try { 
            newsCache.newsHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/World.xml")); 
        } catch { newsCache.newsHeadlines = null; }
        try { 
            newsCache.regionalHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/US.xml")); 
        } catch { newsCache.regionalHeadlines = null; }
        try { 
            newsCache.businessHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/Business.xml")); 
        } catch { newsCache.businessHeadlines = null; }
        try { 
            newsCache.techHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml")); 
        } catch { newsCache.techHeadlines = null; }
        try { 
            newsCache.travelHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/Travel.xml")); 
        } catch { newsCache.travelHeadlines = null; }
        try { 
            newsCache.nytOpinionHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/sunday-review.xml")); 
        } catch { newsCache.nytOpinionHeadlines = null; }
        try { 
            newsCache.healthHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/Health.xml")); 
        } catch { newsCache.healthHeadlines = null; }
        try { 
            newsCache.opinionHeadlines = this.createNewsArray(await parser.parseURL("https://slate.com/feeds/all.rss")); 
        } catch { newsCache.opinionHeadlines = null; }
        try { 
            newsCache.sportsHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml")); 
        } catch { newsCache.sportsHeadlines = null; }
        try { 
            newsCache.entertainmentHeadlines = this.createNewsArray(await parser.parseURL("https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml")); 
        } catch { newsCache.entertainmentHeadlines = null; }

        // set the last updated timestamp and save the file
        newsCache.lastUpdated = Math.floor(Date.now() / 1000);
        this.fs.writeFileSync('./ServiceInfoCache/newsCache.json', JSON.stringify(newsCache));
        console.log(" * Finished downloading news headlines");
        return true;
    }

    async updateReleaseCache() {
        const genreIDs = {
            28: "Action",
            12: "Adventure",
            16: "Animation",
            35: "Comedy",
            80: "Crime",
            99: "Documentary",
            18: "Drama",
            10751: "Family",
            14: "Fantasy",
            36: "History",
            27: "Horror",
            10402: "Music",
            9648: "Mystery",
            10749: "Romance",
            878: "Science Fiction",
            10770: "TV Movie",
            53: "Thriller",
            10752: "War",
            37: "Western",
        };
        var releaseCache = {};
        let parser = new this.Parser();

        // download and format data from the movie DB APIs
        try { 
            let theaterfeed = await this.fetch("https://api.themoviedb.org/3/movie/now_playing", {
                headers: {
                    'Authorization': 'Bearer ' + this.minisrv_config.config.movieApiKey
                }
            });
            theaterfeed = await theaterfeed.json();
            releaseCache.theaterReleases = theaterfeed.results.slice(0, 3).map(function (item) {
                return {
                    title: item.title,
                    genre: genreIDs[item.genre_ids[0]],
                    link: 'client:showalert?message=nuh uh'
                };
            });
        } catch (e) {
            releaseCache.theaterReleases = null;
            console.log(e);
        }
        try { 
            let dvdfeed = await parser.parseURL("https://filmjabber.com/rss/rss-dvd-upcoming.php");
            releaseCache.dvdReleases = dvdfeed.items.slice(0, 3).map(function (item) {
                return {
                    title: item.title
                        .replace(/’|‘/g, "'")
                        .replace(/“|”/g, '"')
                        .replace(/ /g, " "),
                    link: "http://frogfind.com/read.php?a=" + item.link,
                    content: item.content
                        .replace(/’|‘/g, "'")
                        .replace(/“|”/g, '"')
                        .replace(/—|—|–/, "-")
                        .replace(/ /g, " ")
                        .split("<p>")[0],
                };
            });
        } catch {
            releaseCache.dvdReleases = null;
        }
        try { 
            let cdfeed = await parser.parseURL("https://www.metacritic.com/rss/music");
            releaseCache.cdReleases = cdfeed.items.slice(0, 3).map(function (item) {
                return {
                    title: item.title
                        .replace(/’|‘/g, "'")
                        .replace(/“|”/g, '"')
                        .replace(/ /g, " "),
                    link: "http://frogfind.com/read.php?a=" + item.link.replace(/ /g, ""),
                    content: item.content
                        .replace(/’|‘/g, "'")
                        .replace(/“|”/g, '"')
                        .replace(/—|—|–/, "-")
                        .replace(/ /g, " ")
                        .split("<p>")
                        .pop(),
                };
            });
        } catch {
            releaseCache.cdReleases = null;
        }

        releaseCache.lastUpdated = Math.floor(Date.now() / 1000);
        this.fs.writeFileSync('./ServiceInfoCache/releasesCache.json', JSON.stringify(releaseCache));
        console.log(" * Finished downloading new releases");
        return true;
    }

    async updateWeatherCache(zip) {
        // Map TWC iconCodes to WebTV icons
        let twcIcons = {
            0: "lightening",
            1: "lightening",
            2: "lightening",
            3: "lightening",
            4: "lightening",
            5: "p_small",
            6: "25",
            7: "O_y_z",
            8: "Y_Z",
            9: "l",
            10: "26",
            11: "18",
            12: "18",
            13: "19",
            14: "22",
            15: "s_Q",
            16: "22",
            17: "T_t_b_x_a",
            18: "o",
            19: "H",
            20: "F",
            21: "H",
            22: "smoke",
            23: "N",
            24: "N",
            25: "I",
            26: "C_c_v",
            27: "06",
            28: "06",
            29: "03",
            30: "03",
            31: "01",
            32: "01",
            33: "02",
            34: "02",
            35: "lightening",
            36: "30",
            37: "sun_thunder",
            38: "sun_thunder",
            39: "rain_sun",
            40: "R_k_m",
            41: "j",
            42: "P",
            43: "P",
            44: "0",
            45: "W_w_L",
            46: "S_g_i",
            47: "T_t_b_x_a",
            70: "0",
        };

        var weatherCache = {};
        try {
            const weatherFeed = await this.fetch("https://api.weather.com/v3/wx/conditions/current?apiKey=" + this.minisrv_config.config.weatherApiKey + "&postalKey=" + zip + ":US&format=json");
            weatherCache.current = await weatherFeed.json();
            // format the weather cache
            weatherCache.current.icon = twcIcons[weatherCache.current.iconCode] || "";
            weatherCache.current.lastUpdated = Math.floor(Date.now() / 1000);
            this.fs.writeFileSync('./ServiceInfoCache/weatherCache.json', JSON.stringify(weatherCache));
            console.log(" * Finished downloading weather data");
            return true;
        } catch (e) {
            console.log("Could not retrieve weather data");
            return false;
        }
    }

    async getNewsCache() {
        let newsCache;

        try {
            if (!this.fs.existsSync('./ServiceInfoCache/newsCache.json')) {
                // Create the file with initial structure if it doesn't exist
                newsCache = { lastUpdated: 0, newsHeadlines: null };
                this.fs.writeFileSync('./ServiceInfoCache/newsCache.json', JSON.stringify(newsCache));
            } else {
                newsCache = JSON.parse(this.fs.readFileSync('./ServiceInfoCache/newsCache.json'));
            }
        } catch (error) {
            console.error("Error reading or initializing news cache:", error);
            // If we cannot read the cache, initialize a new one
            newsCache = { lastUpdated: 0, newsHeadlines: null };
            this.fs.writeFileSync('./ServiceInfoCache/newsCache.json', JSON.stringify(newsCache));
        }

        const now = Math.floor(Date.now() / 1000);
        
        if (newsCache.lastUpdated + 86400 <= now) {
            console.log(" * News is over a day old, forcing the user to wait while we download the latest headlines");
            await this.updateNewsCache();
            newsCache = JSON.parse(this.fs.readFileSync('./ServiceInfoCache/newsCache.json'));
        } else if (newsCache.lastUpdated + 3600 <= now) {
            console.log(" * News has passed its shelf life, downloading new info in the background");
            this.updateNewsCache();
        }

        return newsCache;
    }

    async getReleasesCache() {
        let releaseCache;

        try {
            if (!this.fs.existsSync('./ServiceInfoCache/releasesCache.json')) {
                // Create the file with initial structure if it doesn't exist
                releaseCache = { lastUpdated: 0, theaterReleases: null, dvdReleases: null, cdReleases: null };
                this.fs.writeFileSync('./ServiceInfoCache/releasesCache.json', JSON.stringify(releaseCache));
            } else {
                releaseCache = JSON.parse(this.fs.readFileSync('./ServiceInfoCache/releasesCache.json'));
            }
        } catch (error) {
            console.error("Error reading or initializing releases cache:", error);
            // If we cannot read the cache, initialize a new one
            releaseCache = { lastUpdated: 0, theaterReleases: null, dvdReleases: null, cdReleases: null };
            this.fs.writeFileSync('./ServiceInfoCache/releasesCache.json', JSON.stringify(releaseCache));
        }

        const now = Math.floor(Date.now() / 1000);
        
        if (releaseCache.lastUpdated + 86400 <= now) {
            console.log(" * Releases are over a day old, forcing the user to wait while we download the latest releases");
            await this.updateReleaseCache();
            releaseCache = JSON.parse(this.fs.readFileSync('./ServiceInfoCache/releasesCache.json'));
        } else if (releaseCache.lastUpdated + 3600 <= now) {
            console.log(" * Releases have passed their shelf life, downloading new info in the background");
            this.updateReleaseCache();
        }

        return releaseCache;
    }

    async getWeatherCache(zip) {
        let weatherCache;

        try {
            if (!this.fs.existsSync('./ServiceInfoCache/weatherCache.json')) {
                // Create the file with initial structure if it doesn't exist
                weatherCache = { lastUpdated: 0, current: null };
                this.fs.writeFileSync('./ServiceInfoCache/weatherCache.json', JSON.stringify(weatherCache));
            } else {
                weatherCache = JSON.parse(this.fs.readFileSync('./ServiceInfoCache/weatherCache.json'));
            }
        } catch (error) {
            console.error("Error reading or initializing weather cache:", error);
            // If we cannot read the cache, initialize a new one
            weatherCache = { lastUpdated: 0, current: null };
            this.fs.writeFileSync('./ServiceInfoCache/weatherCache.json', JSON.stringify(weatherCache));
        }

        const now = Math.floor(Date.now() / 1000);
        
        if (weatherCache.lastUpdated + 3600 <= now) {
            console.log(" * Weather cache is over an hour old, updating...");
            await this.updateWeatherCache(zip);
            weatherCache = JSON.parse(this.fs.readFileSync('./ServiceInfoCache/weatherCache.json'));
        }

        return weatherCache;
    }
}

module.exports = WTVCache;
