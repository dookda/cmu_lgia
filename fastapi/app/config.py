from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PG_HOST: str = "localhost"
    PG_PORT: int = 5433
    PG_USER: str = "postgres"
    PG_PASSWORD: str = "lgia1234"
    PG_NAME: str = "lgia"

    SESSION_SECRET: str = "change_me_to_a_long_random_string"

    LINE_CHANNEL_ID: str = ""
    LINE_CHANNEL_SECRET: str = ""
    LINE_CALLBACK_URL: str = "http://localhost:8000/auth/line/callback"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.PG_USER}:{self.PG_PASSWORD}"
            f"@{self.PG_HOST}:{self.PG_PORT}/{self.PG_NAME}"
        )

    @property
    def database_url_sync(self) -> str:
        return (
            f"postgresql://{self.PG_USER}:{self.PG_PASSWORD}"
            f"@{self.PG_HOST}:{self.PG_PORT}/{self.PG_NAME}"
        )

    class Config:
        env_file = ".env"


settings = Settings()
