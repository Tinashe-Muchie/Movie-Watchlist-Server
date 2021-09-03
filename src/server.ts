
import { ApolloServer, gql } from 'apollo-server';
import { ApolloServer as ApolloServerLambda } from 'apollo-server-lambda';
import { RESTDataSource } from 'apollo-datasource-rest';

const typeDefs = gql`
    type Query {
        getMovies(page: Int!): Movies!
        getTvShows(page: Int!): TvShows!
        getTopRatedMovies: [Movie!]!
        getUpcomingMovies: [Movie!]!
        getTopRatedTvShows: [TvShow!]!
        search(name: String!): [Search!]
    }
    "The Search returns either Movies or TvShows"
    union Search = Movie | TvShow
    
    type Movies {
        page: Int!
        results: [Movie!]!
        total_results: Int!
    }

    type TvShows {
        page: Int!
        results: [TvShow!]!
        total_results: Int!
    }
    
    "The Movies type represents movies retrieved from discover movies"
    type Movie {
        poster_path: String
        release_date: String
        id: Int!
        title: String
        vote_average: Float
        details: MovieDetails
        credits: [Cast!]
        reviews: [Reviews]
        videos: [Videos]
    }
    "The Tv Shows type represents movies retrieved from discover Tv Shows"
    type TvShow {
        poster_path: String
        id: Int!
        vote_average: Float
        first_air_date: String
        name: String
        details: TvShowDetails
        credits: [Cast!]
        reviews: [Reviews]
        videos: [Videos]
    }
    type MovieDetails {
        genres: [Genres]
        id: Int!
        poster_path: String
        release_date: String
        revenue: Int
        runtime: Int
        title: String
        vote_average: Float
    }
    type TvShowDetails {
        created_by: [Creators]
        first_air_date: String
        genres: [Genres]
        id: Int!
        last_air_date: String
        name: String
        number_of_episodes: Int
        number_of_seasons: Int
        poster_path: String    
        seasons: [Seasons]
        vote_average: Float
    }
    type Genres {
        id: Int!
        name: String
    }
    type Seasons {
        air_date: String
        episode_count: Int
        id: Int!
        name: String
        poster_path: String
        season_number: Int
    }
    """
    These are the people that created a Tv Show, to be used in the Tv Show
    details type. 
    """
    type Creators {
        id: Int!
        name: String
        profile_path: String
    }
    "Movie/Tv Show cast"
    type Cast {
        id: Int!
        name: String
        profile_path: String
        character: String
    }
    "Movie/TvShows reviews"
    type Reviews {
        author_details: Author
        content: String
        id: String
    }
    "A movie/Tv Show review author"
    type Author {
        name: String
        avatar_path: String
        rating: String
    }
    "Videos is used to retrieve trailers for movies/ Tv Shows"
    type Videos {
        name: String
        key: String
        site: String
        type: String
        id: String
    }
`;

class MovieAPI extends RESTDataSource {
    constructor(){
        super();
        this.baseURL = 'https://api.themoviedb.org/3/';
    }

    async getMovies(page_number: number) {
        return this.get(`discover/movie?api_key=${process.env.API_KEY}&
        language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page_number}`);
    }

    async getTvShows(page_number) {
        return this.get(`discover/tv?api_key=${process.env.API_KEY}&
        language=en-US&sort_by=popularity.desc&page=${page_number}&include_null_first_air_dates=false`);
    }

    async getMovieDetails(movie_id: number) {
        return this.get(`movie/${movie_id}?api_key=${process.env.API_KEY}&language=en-US`);
    }

    async getTvShowsDetails(tv_id: number) {
        return this.get(`tv/${tv_id}?api_key=${process.env.API_KEY}&language=en-US`);
    }

    async getMovieCasts(movie_id: number) {
        const {cast} = await this.get(`movie/${movie_id}/credits?api_key=${process.env.API_KEY}&
        language=en-US`);
        return cast;
    }

    async getMovieReviews(movie_id: number) {
        const {results} = await this.get(`movie/${movie_id}/reviews?api_key=${process.env.API_KEY}&
        language=en-US&page=1`);
        return results;
    }

    async getMovieVideos(movie_id: number) {
        const {results} = await this.get(`movie/${movie_id}/videos?api_key=${process.env.API_KEY}&
        language=en-US`);
        return results;
    }

    async getPopularMovies() {
        const {results} = await this.get(`movie/popular?api_key=${process.env.API_KEY}&
        language=en-US&page=1`);
        return results;
    }

    async getTopRatedMovies() {
        const {results} = await this.get(`movie/top_rated?api_key=${process.env.API_KEY}&
        language=en-US&page=1`);
        return results;
    }

    async getUpcomingMovies() {
        const {results} = await this.get(`movie/upcoming?api_key=${process.env.API_KEY}&
        language=en-US&page=1`);
        return results;
    }

    async getTvShowCasts(tv_id: number) {
        const {cast} = await this.get(`tv/${tv_id}/credits?api_key=${process.env.API_KEY}&
        language=en-US`);
        return cast;
    }

    async getTvShowReviews(tv_id: number) {
        const {results} = await this.get(`tv/${tv_id}/reviews?api_key=${process.env.API_KEY}&
        language=en-US&page=1`);
        return results;
    }

    async getTvShowVideos(tv_id: number) {
        const {results} = await this.get(`tv/${tv_id}/videos?api_key=${process.env.API_KEY}&
        language=en-US`);
        return results;
    }

    async getPopularTvShows() {
        const {results} = await this.get(`tv/popular?api_key=${process.env.API_KEY}&
        language=en-US&page=1`);
        return results;
    }

    async getTopRatedTvShows() {
        const {results} = await this.get(`tv/top_rated?api_key=${process.env.API_KEY}&
        language=en-US&page=1`);
        return results;
    }

    async Search(query: string) {
        const {results} = await this.get(`search/multi?api_key=${process.env.API_KEY}&
        language=en-US&query=${query}&page=1&include_adult=false`);
        return results;
    } 
}

const resolvers = {
    Query: {
        /*returns an array of movies from the discover endpoint that will be used to 
        populate the movie section in the frontend */
        getMovies: async (_: unknown, {page}:{page: number}, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getMovies(page);
        },
        /*returns an array of Tv Shows from the discover endpoint*/
        getTvShows: async (_: unknown, {page}:{page: number}, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getTvShows(page);
        },
        /*returns an array of top rated movies on tmdb*/
        getTopRatedMovies: async (_: unknown, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getTopRatedMovies();
        },
        /*returns an array of upcoming movies*/
        getUpcomingMovies: async (_: unknown, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getUpcomingMovies();
        },
        /*returns an array of top rated tv shows on tmdb*/
        getTopRatedTvShows: async (_: unknown, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getTopRatedTvShows();
        },
        /*returns an array of either TvShows or movies depending on the client's input*/
        search: async ( _: unknown, {name}:{name: string}, {dataSources}: {dataSources: any}) => {
            const data = await dataSources.movieAPI.Search(name);
            
                return data.map((item) => {
                    if(item.media_type === 'movie') return {
                        __typename: 'Movies',
                        ...item
                    }
                    
                    if(item.media_type === 'tv') return {
                        __typename: 'TvShows',
                        ...item
                    }
                }); 
        }
    },

    Movie: {
        /*returns an object of movie details*/
        details: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getMovieDetails(id);
        },
        /*returns an array of people/actors involved in a movie/Tv Show*/
        credits: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getMovieCasts(id);
        },
        /*returns an array of reviews for a selected movie*/
        reviews: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getMovieReviews(id);
        },
        /*returns an array of trailer videos for a selected movie*/
        videos: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getMovieVideos(id);
        }
    },

    TvShow: {
        /*returns an object of Tv Shows' details*/
        details: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getTvShowsDetails(id);
        },
        /*returns an array of people involved in a tv show*/
        credits: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getTvShowCasts(id);
        },
        /*returns an array of reviews posted by people on the internet about a selected 
        tv show*/
        reviews: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getTvShowReviews(id);
        },
        /*returns an array of trailer videos for tv shows*/
        videos: async ({id}:{id: number}, __: unknown, {dataSources}: {dataSources: any}) => {
            return dataSources.movieAPI.getTvShowVideos(id);
        }
    } 
}

interface MovieIF {
    adult: boolean;
    backdrop_path: string;
    genre_ids: number[];
    id: number;
    media_type: string;
    original_language: string;
    original_title: string;
    overview: string; 
    popularity: number;
    poster_path: string;
    release_date: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
}
    
interface TvShowIF {
    backdrop_path: string;
    first_air_date: string;
    genre_ids: number[];
    id: number;
    media_type: string;
    name: string;
    origin_country: Array<string>;
    original_language: string;
    original_name: string;
    overview: string;
    popularity: number;
    poster_path: string;
    vote_average: number;
    vote_count: number;
}

type item = {
    movie: MovieIF;
    tv: TvShowIF;
}


function createLambdaServer () {
  return new ApolloServerLambda({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    dataSources: () => {
            return { 
                movieAPI : new MovieAPI()
            }
        }
  });
}

function createLocalServer () {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    dataSources: () => {
            return { 
                movieAPI : new MovieAPI()
            }
        }
  });
}

export { createLambdaServer, createLocalServer }
