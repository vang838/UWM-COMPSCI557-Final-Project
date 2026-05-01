from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.users.models import UserPreference


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "confirm_password",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        email = attrs.get("email")

        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "An account with this email already exists."}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        password = validated_data.pop("password")

        user = User(
            **validated_data,
            role=User.Role.USER,
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(password)
        user.save()

        UserPreference.objects.get_or_create(user=user)

        return user


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
        ]
        read_only_fields = ["id", "username", "role"]


class UserPreferenceSerializer(serializers.ModelSerializer):
    default_team_name = serializers.SerializerMethodField()
    default_season_year = serializers.SerializerMethodField()

    class Meta:
        model = UserPreference
        fields = [
            "id",
            "default_team",
            "default_team_name",
            "default_season",
            "default_season_year",
            "compact_tables",
        ]

    def get_default_team_name(self, obj):
        if not obj.default_team:
            return None

        return (
            obj.default_team.display_name
            if hasattr(obj.default_team, "display_name")
            else f"{obj.default_team.city} {obj.default_team.team_name}".strip()
        )

    def get_default_season_year(self, obj):
        return obj.default_season.year if obj.default_season else None


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "username",
            "is_staff",
            "is_superuser",
            "date_joined",
        ]

    def validate_role(self, value):
        valid_roles = {choice[0] for choice in User.Role.choices}

        if value not in valid_roles:
            raise serializers.ValidationError("Invalid role.")

        return value