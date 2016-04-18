"""empty message

Revision ID: 966332ddb8ba
Revises: b4a6bbfeef64
Create Date: 2016-04-18 18:18:46.267000

"""

# revision identifiers, used by Alembic.
revision = '966332ddb8ba'
down_revision = 'b4a6bbfeef64'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('whitelist',
    sa.Column('characterID', sa.Integer(), nullable=False),
    sa.Column('reason', mysql.TEXT(), nullable=True),
    sa.Column('adminID', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['adminID'], [u'characters.id'], ),
    sa.ForeignKeyConstraint(['characterID'], [u'characters.id'], ),
    sa.PrimaryKeyConstraint('characterID')
    
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ##
    op.drop_table('whitelist')
    ### end Alembic commands ###
