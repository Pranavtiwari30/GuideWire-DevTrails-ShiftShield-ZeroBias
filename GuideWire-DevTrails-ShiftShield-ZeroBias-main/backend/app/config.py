from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = ""
    db_name: str = "shiftshield"
    cors_origin: str = "*"
    port: int = 4000
    model_path: str = "app/engine/scoring_model.joblib"

    openweather_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()