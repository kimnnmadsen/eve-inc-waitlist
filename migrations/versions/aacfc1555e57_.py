"""empty message

Revision ID: aacfc1555e57
Revises: eb4f64b6a201
Create Date: 2016-09-22 00:07:10.318000

"""

# revision identifiers, used by Alembic.
revision = 'aacfc1555e57'
down_revision = 'eb4f64b6a201'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('ts_dati', sa.Column('safetyChannelID', sa.Integer(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('ts_dati', 'safetyChannelID')
    ### end Alembic commands ###