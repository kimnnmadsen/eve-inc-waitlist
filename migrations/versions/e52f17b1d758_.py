"""empty message

Revision ID: e52f17b1d758
Revises: 871a8dd84cf7
Create Date: 2016-03-10 19:35:07.390000

"""

# revision identifiers, used by Alembic.
revision = 'e52f17b1d758'
down_revision = '871a8dd84cf7'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('constellation',
    sa.Column('constellationID', sa.Integer(), nullable=False),
    sa.Column('constellationName', sa.String(length=100), nullable=True),
    sa.PrimaryKeyConstraint('constellationID')
    )
    op.create_index(op.f('ix_constellation_constellationName'), 'constellation', ['constellationName'], unique=True)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_constellation_constellationName'), table_name='constellation')
    op.drop_table('constellation')
    ### end Alembic commands ###